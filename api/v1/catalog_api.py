import re

from rest_framework import status
from rest_framework.authentication import TokenAuthentication
from rest_framework.decorators import api_view, authentication_classes, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from api.v1.cashier_auth import CashierTokenAuthentication
from catalog.models import BarcodeCatalog

_BARCODE_RE = re.compile(r"^[A-Za-z0-9-]{1,64}$")


@api_view(["GET"])
@authentication_classes([TokenAuthentication, CashierTokenAuthentication])
@permission_classes([IsAuthenticated])
def barcode_lookup(request):
    barcode = (request.query_params.get("barcode") or "").strip()
    if not _BARCODE_RE.match(barcode):
        return Response({"detail": "Barcode tidak valid"}, status=status.HTTP_400_BAD_REQUEST)
    row = BarcodeCatalog.objects.filter(pk=barcode).values("name").first()
    if not row:
        return Response(
            {"detail": "Barcode tidak ditemukan di katalog"},
            status=status.HTTP_404_NOT_FOUND,
        )
    return Response({"barcode": barcode, "name": row["name"]})
