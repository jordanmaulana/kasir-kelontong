import re

from rest_framework import status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from catalog.models import BarcodeCatalog

_BARCODE_RE = re.compile(r"^[A-Za-z0-9-]{1,64}$")


@api_view(["GET"])
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
