from rest_framework.authentication import BaseAuthentication
from rest_framework.exceptions import AuthenticationFailed

from cashier.models import CashierSession


class CashierTokenAuthentication(BaseAuthentication):
    keyword = "CashierToken"

    def authenticate(self, request):
        header = request.META.get("HTTP_AUTHORIZATION", "")
        if not header.startswith(f"{self.keyword} "):
            return None
        token = header[len(self.keyword) + 1 :].strip()
        if not token:
            raise AuthenticationFailed("Token kasir tidak valid")
        try:
            session = CashierSession.objects.select_related("cashier", "store").get(token=token)
        except CashierSession.DoesNotExist as exc:
            raise AuthenticationFailed("Sesi kasir tidak ditemukan") from exc
        if session.is_expired():
            raise AuthenticationFailed("Sesi kasir kedaluwarsa")
        if not session.cashier.active:
            raise AuthenticationFailed("Akun kasir nonaktif")
        return (session.cashier, session)

    def authenticate_header(self, request):
        return self.keyword
