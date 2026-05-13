from datetime import datetime, time

from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.cashier_auth import CashierTokenAuthentication
from api.v1.serializers import (
    SaleCreateSerializer,
    SaleDetailSerializer,
    SaleListSerializer,
)
from sale.models import Sale
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
    return Response(
        SaleDetailSerializer(sale).data, status=status.HTTP_201_CREATED
    )


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
