from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cashier.models import Cashier, CashierSession
from store.models import Store
from tenant.models import Tenant

User = get_user_model()


def _make_user(email, password="hunter2hunter2"):
    user = User.objects.create_user(username=email, email=email, password=password)
    tenant = Tenant.objects.create(owner=user, name="My Business")
    token = Token.objects.create(user=user)
    return user, tenant, token


def _client_for(token):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


def _make_cashier(store, name="Andi", pin="123456", active=True):
    cashier = Cashier(store=store, display_name=name, active=active)
    cashier.set_pin(pin)
    cashier.save()
    return cashier


class CashierImpersonateTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko Pusat", code="JKT01")
        self.cashier = _make_cashier(self.store, name="Andi", pin="123456")
        self.url = reverse("api-v1-cashier-impersonate", args=[self.store.id, self.cashier.id])

    def test_impersonate_owned_active_cashier_returns_token(self):
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("token", res.data)
        self.assertEqual(res.data["cashier"]["id"], self.cashier.id)
        self.assertEqual(res.data["store"]["id"], self.store.id)
        self.assertEqual(res.data["store"]["code"], "JKT01")

    def test_returned_token_authenticates_cashier_me(self):
        res = self.client.post(self.url)
        token = res.data["token"]
        cashier_client = APIClient()
        cashier_client.credentials(HTTP_AUTHORIZATION=f"CashierToken {token}")
        me = cashier_client.get(reverse("api-v1-cashier-me"))
        self.assertEqual(me.status_code, status.HTTP_200_OK)
        self.assertEqual(me.data["cashier"]["id"], self.cashier.id)

    def test_impersonate_persists_session(self):
        self.assertEqual(CashierSession.objects.filter(cashier=self.cashier).count(), 0)
        self.client.post(self.url)
        self.assertEqual(CashierSession.objects.filter(cashier=self.cashier).count(), 1)

    def test_impersonate_does_not_touch_last_login_at(self):
        self.assertIsNone(self.cashier.last_login_at)
        self.client.post(self.url)
        self.cashier.refresh_from_db()
        self.assertIsNone(self.cashier.last_login_at)

    def test_impersonate_inactive_returns_400(self):
        self.cashier.active = False
        self.cashier.save(update_fields=["active", "updated_on"])
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Kasir nonaktif")
        self.assertEqual(CashierSession.objects.filter(cashier=self.cashier).count(), 0)

    def test_impersonate_unknown_cashier_returns_404(self):
        url = reverse(
            "api-v1-cashier-impersonate",
            args=[self.store.id, "000000000000000000000000"],
        )
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_impersonate_cross_tenant_returns_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).post(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertEqual(CashierSession.objects.filter(cashier=self.cashier).count(), 0)

    def test_impersonate_store_mismatch_returns_404(self):
        other_store = Store.objects.create(tenant=self.tenant, name="Cabang", code="JKT02")
        url = reverse("api-v1-cashier-impersonate", args=[other_store.id, self.cashier.id])
        res = self.client.post(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_impersonate_unauthenticated_returns_401(self):
        res = APIClient().post(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_impersonate_get_not_allowed(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_405_METHOD_NOT_ALLOWED)
