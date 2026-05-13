from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
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


def _make_cashier(store, name="Andi", pin="123456", active=True):
    cashier = Cashier(store=store, display_name=name, active=active)
    cashier.set_pin(pin)
    cashier.save()
    return cashier


def _cashier_client(token):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"CashierToken {token}")
    return client


class CashierLoginTests(TestCase):
    def setUp(self):
        self.user, self.tenant, _ = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko Pusat", code="JKT01")
        self.cashier = _make_cashier(self.store, name="Andi", pin="123456")
        self.url = reverse("api-v1-cashier-login")

    def test_login_success(self):
        res = APIClient().post(self.url, {"store_code": "JKT01", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("token", res.data)
        self.assertEqual(res.data["cashier"]["display_name"], "Andi")
        self.assertEqual(res.data["store"]["code"], "JKT01")
        self.cashier.refresh_from_db()
        self.assertIsNotNone(self.cashier.last_login_at)
        self.assertTrue(CashierSession.objects.filter(cashier=self.cashier).exists())

    def test_login_lowercase_store_code_normalized(self):
        res = APIClient().post(self.url, {"store_code": "jkt01", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_wrong_pin_400_generic(self):
        res = APIClient().post(self.url, {"store_code": "JKT01", "pin": "999999"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Kode toko atau PIN salah")

    def test_wrong_store_code_400_generic(self):
        res = APIClient().post(self.url, {"store_code": "BDG99", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Kode toko atau PIN salah")

    def test_inactive_cashier_400(self):
        self.cashier.active = False
        self.cashier.save()
        res = APIClient().post(self.url, {"store_code": "JKT01", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_bad_pin_format_400(self):
        res = APIClient().post(self.url, {"store_code": "JKT01", "pin": "abc"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_bad_store_code_format_400(self):
        res = APIClient().post(self.url, {"store_code": "x", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("store_code", res.data)

    def test_cross_tenant_code_collision_resolves_by_pin(self):
        _, other_tenant, _ = _make_user("z@b.com")
        other_store = Store.objects.create(tenant=other_tenant, name="Other", code="JKT01")
        other_cashier = _make_cashier(other_store, name="Budi", pin="654321")

        res1 = APIClient().post(self.url, {"store_code": "JKT01", "pin": "123456"}, format="json")
        self.assertEqual(res1.status_code, status.HTTP_200_OK)
        self.assertEqual(res1.data["cashier"]["id"], self.cashier.id)

        res2 = APIClient().post(self.url, {"store_code": "JKT01", "pin": "654321"}, format="json")
        self.assertEqual(res2.status_code, status.HTTP_200_OK)
        self.assertEqual(res2.data["cashier"]["id"], other_cashier.id)


class CashierSessionAuthTests(TestCase):
    def setUp(self):
        self.user, self.tenant, _ = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko Pusat", code="JKT01")
        self.cashier = _make_cashier(self.store, name="Andi", pin="123456")
        self.session = CashierSession.issue(self.cashier)

    def test_cashier_me_success(self):
        client = _cashier_client(self.session.token)
        res = client.get(reverse("api-v1-cashier-me"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["cashier"]["id"], self.cashier.id)

    def test_cashier_me_missing_token_401(self):
        res = APIClient().get(reverse("api-v1-cashier-me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cashier_me_bad_token_401(self):
        client = _cashier_client("not-a-real-token")
        res = client.get(reverse("api-v1-cashier-me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_expired_session_401(self):
        self.session.expires_at = timezone.now() - timedelta(seconds=1)
        self.session.save(update_fields=["expires_at"])
        client = _cashier_client(self.session.token)
        res = client.get(reverse("api-v1-cashier-me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_inactive_cashier_blocks_session(self):
        self.cashier.active = False
        self.cashier.save()
        client = _cashier_client(self.session.token)
        res = client.get(reverse("api-v1-cashier-me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_logout_deletes_session(self):
        client = _cashier_client(self.session.token)
        res = client.post(reverse("api-v1-cashier-logout"))
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(CashierSession.objects.filter(id=self.session.id).exists())

    def test_admin_token_rejected_on_cashier_endpoint(self):
        admin_token = Token.objects.get(user=self.user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {admin_token.key}")
        res = client.get(reverse("api-v1-cashier-me"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_cashier_token_rejected_on_admin_endpoint(self):
        client = _cashier_client(self.session.token)
        res = client.get(reverse("api-v1-stores"))
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
