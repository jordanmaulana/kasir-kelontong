import csv
from datetime import date, datetime, time

from django.db.models import Sum
from django.http import HttpResponse
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1._tenant import require_store
from api.v1.cashier_auth import CashierTokenAuthentication
from api.v1.serializers import (
    SaleCreateSerializer,
    SaleDetailSerializer,
    SaleListSerializer,
    SaleReportRowSerializer,
    TopProductRowSerializer,
)
from sale.models import Sale, SaleLine
from sale.services import (
    InsufficientTenderError,
    SaleValidationError,
    create_sale,
)
from stock.services import OutOfStockError


@api_view(["POST"])
@authentication_classes([CashierTokenAuthentication])
@permission_classes([IsAuthenticated])
def create_sale_view(request):
    serializer = SaleCreateSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    try:
        sale = create_sale(
            store=request.auth.store,
            cashier=request.user,
            lines=serializer.validated_data["lines"],
            tendered=serializer.validated_data["tendered"],
        )
    except SaleValidationError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except OutOfStockError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)
    except InsufficientTenderError as exc:
        return Response({"detail": str(exc)}, status=status.HTTP_400_BAD_REQUEST)

    sale = (
        Sale.objects.select_related("store", "cashier")
        .prefetch_related("lines__product")
        .get(pk=sale.pk)
    )
    return Response(SaleDetailSerializer(sale).data, status=status.HTTP_201_CREATED)


@api_view(["GET"])
@authentication_classes([CashierTokenAuthentication])
@permission_classes([IsAuthenticated])
def list_my_sales_today(request):
    today = timezone.localdate()
    start_naive = datetime.combine(today, time.min)
    start = timezone.make_aware(start_naive, timezone.get_current_timezone())
    qs = (
        Sale.objects.filter(cashier=request.user, created_on__gte=start)
        .prefetch_related("lines")
        .order_by("-created_on")[:200]
    )
    return Response(SaleListSerializer(qs, many=True).data)


def _parse_iso_date(value):
    try:
        return date.fromisoformat(value)
    except (TypeError, ValueError):
        return None


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def store_sales_report(request, store_id):
    store, err = require_store(request.user, store_id)
    if err:
        return err

    today = timezone.localdate()
    from_raw = request.query_params.get("from")
    to_raw = request.query_params.get("to")
    from_date = _parse_iso_date(from_raw) if from_raw else today
    to_date = _parse_iso_date(to_raw) if to_raw else from_date
    if from_date is None or to_date is None:
        return Response(
            {"detail": "Tanggal tidak valid"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    if from_date > to_date:
        return Response(
            {"detail": "Rentang tanggal tidak valid"},
            status=status.HTTP_400_BAD_REQUEST,
        )

    tz = timezone.get_current_timezone()
    start = timezone.make_aware(datetime.combine(from_date, time.min), tz)
    end = timezone.make_aware(datetime.combine(to_date, time.max), tz)

    sales_qs = (
        Sale.objects.filter(store=store, created_on__gte=start, created_on__lte=end)
        .select_related("cashier")
        .prefetch_related("lines__product")
        .order_by("-created_on")
    )

    export = (request.query_params.get("export") or "").lower()
    if export == "csv":
        return _sales_report_csv(store, sales_qs, from_date, to_date)

    sales = list(sales_qs)
    count = len(sales)
    gross_revenue = 0
    items_sold = 0
    for sale in sales:
        gross_revenue += sale.subtotal
        for line in sale.lines.all():
            items_sold += line.qty

    top_rows = (
        SaleLine.objects.filter(
            sale__store=store,
            sale__created_on__gte=start,
            sale__created_on__lte=end,
        )
        .values("product_id", "product__name", "product__barcode")
        .annotate(qty_sold=Sum("qty"), revenue=Sum("line_total"))
        .order_by("-qty_sold", "product__name")[:10]
    )
    top_products = [
        {
            "product_id": row["product_id"],
            "name": row["product__name"],
            "barcode": row["product__barcode"],
            "qty_sold": row["qty_sold"] or 0,
            "revenue": row["revenue"] or 0,
        }
        for row in top_rows
    ]

    return Response(
        {
            "from": from_date.isoformat(),
            "to": to_date.isoformat(),
            "summary": {
                "count": count,
                "gross_revenue": gross_revenue,
                "items_sold": items_sold,
            },
            "sales": SaleReportRowSerializer(sales, many=True).data,
            "top_products": TopProductRowSerializer(top_products, many=True).data,
        }
    )


def _sales_report_csv(store, sales_qs, from_date, to_date):
    response = HttpResponse(content_type="text/csv; charset=utf-8")
    filename = f"sales-{store.code}-{from_date.isoformat()}-{to_date.isoformat()}.csv"
    response["Content-Disposition"] = f'attachment; filename="{filename}"'
    writer = csv.writer(response)
    writer.writerow(
        [
            "sale_id",
            "created_on",
            "cashier",
            "barcode",
            "product",
            "qty",
            "unit_price",
            "line_total",
            "sale_subtotal",
            "sale_tendered",
            "sale_change",
        ]
    )
    for sale in sales_qs:
        for line in sale.lines.all():
            writer.writerow(
                [
                    sale.id,
                    sale.created_on.isoformat(),
                    sale.cashier.display_name,
                    line.product.barcode or "",
                    line.product.name,
                    line.qty,
                    line.unit_price,
                    line.line_total,
                    sale.subtotal,
                    sale.tendered,
                    sale.change,
                ]
            )
    return response
