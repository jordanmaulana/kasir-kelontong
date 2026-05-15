from django.db import transaction
from django.db.models import Q
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1._tenant import require_store
from api.v1.cashier_auth import CashierTokenAuthentication
from api.v1.serializers import (
    AdjustmentSerializer,
    ReceivingSerializer,
    StockListItemSerializer,
    StockMovementSerializer,
)
from product.models import Product
from stock.models import StockMovement, StockReason, StoreStock
from stock.services import OutOfStockError, record_movement


def build_stock_rows(store, q=""):
    products = Product.objects.filter(tenant=store.tenant, archived_at__isnull=True)
    q = (q or "").strip()
    if q:
        products = products.filter(Q(name__icontains=q) | Q(barcode__icontains=q))
    stocks = {s.product_id: s for s in StoreStock.objects.filter(store=store, product__in=products)}
    rows = []
    for p in products:
        s = stocks.get(p.id)
        rows.append(
            {
                "product_id": p.id,
                "name": p.name,
                "barcode": p.barcode,
                "sell_price": p.sell_price,
                "qty": s.qty if s else 0,
                "last_movement_at": s.last_movement_at if s else None,
                "bundle_qty": p.bundle_qty,
                "bundle_price": p.bundle_price,
                "bundle_label": p.bundle_label,
            }
        )
    return rows


class StoreStockView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        store, err = require_store(request.user, store_id)
        if err:
            return err
        rows = build_stock_rows(store, request.query_params.get("q", ""))
        return Response(StockListItemSerializer(rows, many=True).data)


class CashierStockView(APIView):
    authentication_classes = [CashierTokenAuthentication]
    permission_classes = [IsAuthenticated]

    def get(self, request):
        store = request.auth.store
        rows = build_stock_rows(store, request.query_params.get("q", ""))
        return Response(StockListItemSerializer(rows, many=True).data)


class StoreMovementsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        store, err = require_store(request.user, store_id)
        if err:
            return err
        qs = StockMovement.objects.filter(store=store).select_related("product", "actor")
        product_id = request.query_params.get("product")
        if product_id:
            qs = qs.filter(product_id=product_id)
        reason = request.query_params.get("reason")
        if reason:
            qs = qs.filter(reason=reason)
        limit = request.query_params.get("limit")
        try:
            limit_int = int(limit) if limit else 100
        except ValueError:
            limit_int = 100
        limit_int = max(1, min(limit_int, 500))
        qs = qs[:limit_int]
        return Response(StockMovementSerializer(qs, many=True).data)


class StoreReceivingView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, store_id):
        store, err = require_store(request.user, store_id)
        if err:
            return err
        serializer = ReceivingSerializer(data=request.data, context={"store": store})
        serializer.is_valid(raise_exception=True)
        items = serializer.validated_data["items"]
        products = {
            p.id: p
            for p in Product.objects.filter(
                id__in=[i["product_id"] for i in items],
                tenant=store.tenant,
                archived_at__isnull=True,
            )
        }
        movements = []
        with transaction.atomic():
            for item in items:
                movement = record_movement(
                    store=store,
                    product=products[item["product_id"]],
                    delta=item["qty"],
                    reason=StockReason.RECEIVING,
                    actor=request.user,
                    note=item.get("note", ""),
                )
                movements.append(movement)
        return Response(
            StockMovementSerializer(movements, many=True).data,
            status=status.HTTP_201_CREATED,
        )


class StoreAdjustmentView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, store_id):
        store, err = require_store(request.user, store_id)
        if err:
            return err
        serializer = AdjustmentSerializer(data=request.data, context={"store": store})
        serializer.is_valid(raise_exception=True)
        data = serializer.validated_data
        product = Product.objects.get(
            id=data["product_id"], tenant=store.tenant, archived_at__isnull=True
        )
        with transaction.atomic():
            if "target_qty" in data:
                stock = (
                    StoreStock.objects.select_for_update()
                    .filter(store=store, product=product)
                    .first()
                )
                current = stock.qty if stock else 0
                delta = data["target_qty"] - current
                if delta == 0:
                    return Response(
                        {"detail": "Jumlah sudah sesuai, tidak ada perubahan"},
                        status=status.HTTP_400_BAD_REQUEST,
                    )
            else:
                delta = data["delta"]
            try:
                movement = record_movement(
                    store=store,
                    product=product,
                    delta=delta,
                    reason=StockReason.ADJUSTMENT,
                    actor=request.user,
                    note=data["note"],
                )
            except OutOfStockError as exc:
                return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
        return Response(StockMovementSerializer(movement).data, status=status.HTTP_201_CREATED)
