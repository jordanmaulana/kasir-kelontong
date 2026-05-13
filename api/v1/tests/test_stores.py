from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

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


class StoresListCreateTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.url = reverse("api-v1-stores")

    def test_list_empty(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_list_returns_only_own_tenant_stores(self):
        Store.objects.create(tenant=self.tenant, name="Toko Pusat", code="JKT01")
        other_user, other_tenant, _ = _make_user("z@b.com")
        Store.objects.create(tenant=other_tenant, name="Other", code="BDG01")
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["code"], "JKT01")

    def test_create_success(self):
        res = self.client.post(
            self.url,
            {"name": "Toko Pusat", "code": "JKT01", "address": "Jl. Sudirman 1"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["code"], "JKT01")
        self.assertEqual(res.data["name"], "Toko Pusat")
        self.assertTrue(Store.objects.filter(tenant=self.tenant, code="JKT01").exists())

    def test_create_normalizes_code_to_upper(self):
        res = self.client.post(
            self.url, {"name": "Toko", "code": "jkt01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["code"], "JKT01")

    def test_create_duplicate_code_in_tenant_400(self):
        Store.objects.create(tenant=self.tenant, name="Toko", code="JKT01")
        res = self.client.post(
            self.url, {"name": "Toko 2", "code": "JKT01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", res.data)

    def test_same_code_allowed_across_tenants(self):
        other_user, other_tenant, _ = _make_user("z@b.com")
        Store.objects.create(tenant=other_tenant, name="Other", code="JKT01")
        res = self.client.post(
            self.url, {"name": "Toko Pusat", "code": "JKT01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_invalid_code_format_400(self):
        res = self.client.post(
            self.url, {"name": "Toko", "code": "JK"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", res.data)

    def test_invalid_code_special_chars_400(self):
        res = self.client.post(
            self.url, {"name": "Toko", "code": "JKT-01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", res.data)

    def test_missing_name_400(self):
        res = self.client.post(self.url, {"code": "JKT01"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res.data)

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class StoreDetailTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(
            tenant=self.tenant, name="Toko Pusat", code="JKT01"
        )
        self.url = reverse("api-v1-store-detail", args=[self.store.id])

    def test_get_own_store(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["code"], "JKT01")

    def test_patch_updates_fields(self):
        res = self.client.patch(
            self.url, {"name": "Toko Cabang"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.store.refresh_from_db()
        self.assertEqual(self.store.name, "Toko Cabang")
        self.assertEqual(self.store.code, "JKT01")

    def test_patch_code_normalizes(self):
        res = self.client.patch(self.url, {"code": "jkt02"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.store.refresh_from_db()
        self.assertEqual(self.store.code, "JKT02")

    def test_patch_duplicate_code_400(self):
        Store.objects.create(tenant=self.tenant, name="Toko 2", code="JKT02")
        res = self.client.patch(self.url, {"code": "JKT02"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", res.data)

    def test_patch_same_code_allowed_on_self(self):
        res = self.client.patch(self.url, {"code": "JKT01"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_store(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Store.objects.filter(id=self.store.id).exists())

    def test_tenant_isolation_get_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).get(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_tenant_isolation_patch_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).patch(
            self.url, {"name": "Hacked"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.store.refresh_from_db()
        self.assertEqual(self.store.name, "Toko Pusat")

    def test_tenant_isolation_delete_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Store.objects.filter(id=self.store.id).exists())

    def test_unknown_id_404(self):
        res = self.client.get(
            reverse("api-v1-store-detail", args=["000000000000000000000000"])
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class RegisterCreatesTenantTests(TestCase):
    def test_register_creates_tenant(self):
        client = APIClient()
        res = client.post(
            reverse("api-v1-auth-register"),
            {"email": "new@b.com", "password": "hunter2hunter2"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        user = User.objects.get(username="new@b.com")
        self.assertTrue(Tenant.objects.filter(owner=user).exists())
