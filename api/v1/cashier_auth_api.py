from django.db import transaction
from django.utils import timezone
from rest_framework import status
from rest_framework.decorators import (
    api_view,
    authentication_classes,
    permission_classes,
)
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.v1.cashier_auth import CashierTokenAuthentication
from api.v1.serializers import (
    CashierLoginSerializer,
    CashierSessionSerializer,
)
from core.models import CashierSession, Store

INVALID_CRED = {"detail": "Kode toko atau PIN salah"}


@api_view(["POST"])
@authentication_classes([])
@permission_classes([AllowAny])
def cashier_login(request):
    # TODO: add ScopedRateThrottle (cashier_login: 20/min) before scaling out.
    # Store codes are tenant-scoped — multiple tenants may share the same code.
    # We iterate all matching stores and disambiguate via PIN. First hit wins.
    serializer = CashierLoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    store_code = serializer.validated_data["store_code"]
    pin = serializer.validated_data["pin"]

    stores = Store.objects.filter(code=store_code).prefetch_related("cashiers")
    matched = None
    for store in stores:
        for cashier in store.cashiers.filter(active=True):
            if cashier.check_pin(pin):
                matched = cashier
                break
        if matched:
            break

    if matched is None:
        return Response(INVALID_CRED, status=status.HTTP_400_BAD_REQUEST)

    with transaction.atomic():
        matched.last_login_at = timezone.now()
        matched.save(update_fields=["last_login_at", "updated_on"])
        session = CashierSession.issue(matched)

    return Response(CashierSessionSerializer(session).data)


@api_view(["POST"])
@authentication_classes([CashierTokenAuthentication])
@permission_classes([IsAuthenticated])
def cashier_logout(request):
    request.auth.delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@authentication_classes([CashierTokenAuthentication])
@permission_classes([IsAuthenticated])
def cashier_me(request):
    return Response(CashierSessionSerializer(request.auth).data)
