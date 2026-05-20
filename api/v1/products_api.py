from math import ceil

from django.db import transaction
from django.db.models import Q
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1._tenant import require_tenant as _require_tenant
from api.v1.serializers import ProductSerializer
from product.models import Product
from stock.models import StockReason
from stock.services import record_movement


class ProductsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant, err = _require_tenant(request.user)
        if err:
            return err
        qs = Product.objects.filter(tenant=tenant, archived_at__isnull=True)
        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(barcode__icontains=q))

        try:
            page = max(1, int(request.query_params.get("page", 1)))
        except (TypeError, ValueError):
            page = 1
        try:
            page_size = int(request.query_params.get("page_size", 20))
        except (TypeError, ValueError):
            page_size = 20
        page_size = max(1, min(100, page_size))

        count = qs.count()
        total_pages = max(1, ceil(count / page_size))
        if count > 0 and page > total_pages:
            page = total_pages
        offset = (page - 1) * page_size
        items = qs[offset:offset + page_size]

        return Response({
            "results": ProductSerializer(items, many=True).data,
            "count": count,
            "page": page,
            "page_size": page_size,
            "total_pages": total_pages,
        })

    def post(self, request):
        tenant, err = _require_tenant(request.user)
        if err:
            return err
        serializer = ProductSerializer(data=request.data, context={"tenant": tenant})
        serializer.is_valid(raise_exception=True)
        initial_store = serializer.validated_data.get("_initial_store")
        initial_qty = serializer.validated_data.get("initial_qty")
        with transaction.atomic():
            product = serializer.save(tenant=tenant, actor=request.user)
            if initial_store and initial_qty is not None:
                record_movement(
                    store=initial_store,
                    product=product,
                    delta=initial_qty,
                    reason=StockReason.RECEIVING,
                    actor=request.user,
                )
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_product(self, request, product_id):
        tenant, err = _require_tenant(request.user)
        if err:
            return None, err
        product = get_object_or_404(Product, id=product_id, tenant=tenant, archived_at__isnull=True)
        return product, None

    def get(self, request, product_id):
        product, err = self._get_product(request, product_id)
        if err:
            return err
        return Response(ProductSerializer(product).data)

    def patch(self, request, product_id):
        product, err = self._get_product(request, product_id)
        if err:
            return err
        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True,
            context={"tenant": product.tenant},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(actor=request.user)
        return Response(ProductSerializer(product).data)

    def delete(self, request, product_id):
        product, err = self._get_product(request, product_id)
        if err:
            return err
        product.archived_at = timezone.now()
        product.actor = request.user
        product.save(update_fields=["archived_at", "actor", "updated_on"])
        return Response(status=status.HTTP_204_NO_CONTENT)
