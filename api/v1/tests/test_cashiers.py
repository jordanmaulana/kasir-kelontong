from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cashier.models import Cashier
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


class CashiersListCreateTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko Pusat", code="JKT01")
        self.url = reverse("api-v1-cashiers", args=[self.store.id])

    def test_list_empty(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_list_scoped_to_store(self):
        _make_cashier(self.store, name="Andi")
        other = Store.objects.create(tenant=self.tenant, name="Cabang", code="JKT02")
        _make_cashier(other, name="Budi")
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["display_name"], "Andi")

    def test_list_includes_inactive(self):
        _make_cashier(self.store, name="Andi", active=False)
        res = self.client.get(self.url)
        self.assertEqual(len(res.data), 1)
        self.assertFalse(res.data[0]["active"])

    def test_create_success(self):
        res = self.client.post(
            self.url,
            {"display_name": "Andi", "pin": "123456"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["display_name"], "Andi")
        self.assertTrue(res.data["active"])
        self.assertNotIn("pin", res.data)
        self.assertNotIn("pin_hash", res.data)
        cashier = Cashier.objects.get(id=res.data["id"])
        self.assertTrue(cashier.check_pin("123456"))

    def test_create_pin_too_short_400(self):
        res = self.client.post(self.url, {"display_name": "Andi", "pin": "12345"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_create_pin_too_long_400(self):
        res = self.client.post(self.url, {"display_name": "Andi", "pin": "1234567"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_create_pin_non_digits_400(self):
        res = self.client.post(self.url, {"display_name": "Andi", "pin": "12345a"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_create_missing_pin_400(self):
        res = self.client.post(self.url, {"display_name": "Andi"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_create_missing_name_400(self):
        res = self.client.post(self.url, {"pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("display_name", res.data)

    def test_create_duplicate_active_pin_400(self):
        _make_cashier(self.store, name="Andi", pin="123456")
        res = self.client.post(self.url, {"display_name": "Budi", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_same_pin_allowed_across_stores(self):
        other_store = Store.objects.create(tenant=self.tenant, name="Cabang", code="JKT02")
        _make_cashier(other_store, name="Andi", pin="123456")
        res = self.client.post(self.url, {"display_name": "Budi", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_pin_reuse_after_deactivation(self):
        _make_cashier(self.store, name="Andi", pin="123456", active=False)
        res = self.client.post(self.url, {"display_name": "Budi", "pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_tenant_isolation_list_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).get(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_tenant_isolation_create_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).post(
            self.url, {"display_name": "Hacker", "pin": "999999"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class CashierDetailTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko Pusat", code="JKT01")
        self.cashier = _make_cashier(self.store, name="Andi", pin="123456")
        self.url = reverse("api-v1-cashier-detail", args=[self.store.id, self.cashier.id])

    def test_get_detail(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["display_name"], "Andi")
        self.assertNotIn("pin_hash", res.data)

    def test_patch_rename(self):
        res = self.client.patch(self.url, {"display_name": "Andika"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.cashier.refresh_from_db()
        self.assertEqual(self.cashier.display_name, "Andika")
        self.assertTrue(self.cashier.check_pin("123456"))

    def test_patch_new_pin_rehashes(self):
        old_hash = self.cashier.pin_hash
        res = self.client.patch(self.url, {"pin": "654321"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.cashier.refresh_from_db()
        self.assertNotEqual(self.cashier.pin_hash, old_hash)
        self.assertTrue(self.cashier.check_pin("654321"))
        self.assertFalse(self.cashier.check_pin("123456"))

    def test_patch_pin_collision_400(self):
        _make_cashier(self.store, name="Budi", pin="654321")
        res = self.client.patch(self.url, {"pin": "654321"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_patch_same_pin_on_self_allowed(self):
        res = self.client.patch(self.url, {"pin": "123456"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_patch_invalid_pin_format_400(self):
        res = self.client.patch(self.url, {"pin": "abc"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("pin", res.data)

    def test_patch_toggle_active(self):
        res = self.client.patch(self.url, {"active": False}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.cashier.refresh_from_db()
        self.assertFalse(self.cashier.active)

    def test_delete_is_soft(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.cashier.refresh_from_db()
        self.assertFalse(self.cashier.active)
        self.assertTrue(Cashier.objects.filter(id=self.cashier.id).exists())

    def test_tenant_isolation_get_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).get(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_tenant_isolation_patch_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).patch(self.url, {"display_name": "Hacked"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.cashier.refresh_from_db()
        self.assertEqual(self.cashier.display_name, "Andi")

    def test_tenant_isolation_delete_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.cashier.refresh_from_db()
        self.assertTrue(self.cashier.active)

    def test_store_mismatch_404(self):
        other_store = Store.objects.create(tenant=self.tenant, name="Cabang", code="JKT02")
        bad_url = reverse("api-v1-cashier-detail", args=[other_store.id, self.cashier.id])
        res = self.client.get(bad_url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unknown_id_404(self):
        url = reverse(
            "api-v1-cashier-detail",
            args=[self.store.id, "000000000000000000000000"],
        )
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
