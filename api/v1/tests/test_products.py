from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from product.models import Product
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


class ProductsListCreateTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.url = reverse("api-v1-products")

    def test_list_empty(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, [])

    def test_list_returns_only_own_tenant_products(self):
        Product.objects.create(tenant=self.tenant, name="Indomie", sell_price=3500)
        _, other_tenant, _ = _make_user("z@b.com")
        Product.objects.create(tenant=other_tenant, name="Other", sell_price=1000)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], "Indomie")

    def test_create_product_minimal(self):
        res = self.client.post(self.url, {"name": "Gula 1kg", "sell_price": 15000}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["name"], "Gula 1kg")
        self.assertEqual(res.data["sell_price"], 15000)
        self.assertIsNone(res.data["barcode"])

    def test_create_product_with_barcode(self):
        res = self.client.post(
            self.url,
            {
                "name": "Indomie Goreng",
                "barcode": "8992388101012",
                "sell_price": 3500,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["barcode"], "8992388101012")

    def test_barcode_unique_within_tenant_rejects_dup(self):
        Product.objects.create(tenant=self.tenant, name="A", barcode="111", sell_price=100)
        res = self.client.post(
            self.url,
            {"name": "B", "barcode": "111", "sell_price": 200},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("barcode", res.data)

    def test_same_barcode_allowed_across_tenants(self):
        _, other_tenant, _ = _make_user("z@b.com")
        Product.objects.create(tenant=other_tenant, name="A", barcode="111", sell_price=100)
        res = self.client.post(
            self.url,
            {"name": "B", "barcode": "111", "sell_price": 200},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)

    def test_multiple_null_barcodes_allowed_in_same_tenant(self):
        self.client.post(self.url, {"name": "A", "sell_price": 100}, format="json")
        res = self.client.post(self.url, {"name": "B", "sell_price": 200}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(Product.objects.filter(tenant=self.tenant).count(), 2)

    def test_missing_name_400(self):
        res = self.client.post(self.url, {"sell_price": 100}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res.data)

    def test_negative_price_rejected(self):
        res = self.client.post(self.url, {"name": "X", "sell_price": -1}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("sell_price", res.data)

    def test_invalid_barcode_chars_400(self):
        res = self.client.post(
            self.url,
            {"name": "X", "barcode": "abc def", "sell_price": 100},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("barcode", res.data)

    def test_blank_barcode_stored_as_null(self):
        res = self.client.post(
            self.url,
            {"name": "X", "barcode": "", "sell_price": 100},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(res.data["barcode"])
        product = Product.objects.get(id=res.data["id"])
        self.assertIsNone(product.barcode)

    def test_search_by_q_param(self):
        Product.objects.create(
            tenant=self.tenant, name="Indomie Goreng", barcode="111", sell_price=3500
        )
        Product.objects.create(tenant=self.tenant, name="Sarimi", barcode="222", sell_price=3000)
        res = self.client.get(self.url + "?q=indomie")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], "Indomie Goreng")

    def test_search_by_barcode_substring(self):
        Product.objects.create(
            tenant=self.tenant, name="A", barcode="8992388101012", sell_price=100
        )
        Product.objects.create(tenant=self.tenant, name="B", sell_price=200)
        res = self.client.get(self.url + "?q=88101")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], "A")

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_create_with_bundle_fields(self):
        res = self.client.post(
            self.url,
            {
                "name": "Sachet Kopi",
                "barcode": "999",
                "sell_price": 1500,
                "bundle_qty": 10,
                "bundle_price": 13000,
                "bundle_label": "Renteng",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["bundle_qty"], 10)
        self.assertEqual(res.data["bundle_price"], 13000)
        self.assertEqual(res.data["bundle_label"], "Renteng")

    def test_create_partial_bundle_400(self):
        res = self.client.post(
            self.url,
            {
                "name": "Sachet",
                "sell_price": 1500,
                "bundle_qty": 10,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_create_bundle_qty_min_2(self):
        res = self.client.post(
            self.url,
            {
                "name": "Sachet",
                "sell_price": 1500,
                "bundle_qty": 1,
                "bundle_price": 1500,
                "bundle_label": "Pak",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("bundle_qty", res.data)


class ProductDetailTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.product = Product.objects.create(
            tenant=self.tenant,
            name="Indomie Goreng",
            barcode="8992388101012",
            sell_price=3500,
        )
        self.url = reverse("api-v1-product-detail", args=[self.product.id])

    def test_get_own_product(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "Indomie Goreng")

    def test_patch_updates_fields(self):
        res = self.client.patch(
            self.url, {"name": "Indomie Goreng Spesial", "sell_price": 4000}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Indomie Goreng Spesial")
        self.assertEqual(self.product.sell_price, 4000)

    def test_patch_can_clear_barcode(self):
        res = self.client.patch(self.url, {"barcode": ""}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.product.refresh_from_db()
        self.assertIsNone(self.product.barcode)

    def test_patch_duplicate_barcode_400(self):
        Product.objects.create(tenant=self.tenant, name="Other", barcode="999", sell_price=100)
        res = self.client.patch(self.url, {"barcode": "999"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("barcode", res.data)

    def test_patch_same_barcode_allowed_on_self(self):
        res = self.client.patch(self.url, {"barcode": "8992388101012"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)

    def test_delete_returns_204(self):
        res = self.client.delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.product.refresh_from_db()
        self.assertIsNotNone(self.product.archived_at)

    def test_tenant_isolation_get_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).get(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_tenant_isolation_patch_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).patch(self.url, {"name": "Hacked"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.product.refresh_from_db()
        self.assertEqual(self.product.name, "Indomie Goreng")

    def test_tenant_isolation_delete_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).delete(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)
        self.assertTrue(Product.objects.filter(id=self.product.id).exists())

    def test_patch_enable_bundle(self):
        res = self.client.patch(
            self.url,
            {"bundle_qty": 20, "bundle_price": 18000, "bundle_label": "Renteng"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.product.refresh_from_db()
        self.assertEqual(self.product.bundle_qty, 20)
        self.assertEqual(self.product.bundle_price, 18000)
        self.assertEqual(self.product.bundle_label, "Renteng")

    def test_patch_partial_bundle_400(self):
        res = self.client.patch(self.url, {"bundle_qty": 20}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_clear_bundle(self):
        self.product.bundle_qty = 20
        self.product.bundle_price = 18000
        self.product.bundle_label = "Renteng"
        self.product.save()
        res = self.client.patch(
            self.url,
            {"bundle_qty": None, "bundle_price": None, "bundle_label": None},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.product.refresh_from_db()
        self.assertIsNone(self.product.bundle_qty)
        self.assertIsNone(self.product.bundle_price)
        self.assertIsNone(self.product.bundle_label)

    def test_unknown_id_404(self):
        res = self.client.get(reverse("api-v1-product-detail", args=["000000000000000000000000"]))
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class WeightedProductTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.url = reverse("api-v1-products")

    def test_create_weighted_product(self):
        res = self.client.post(
            self.url,
            {
                "name": "Telur",
                "sell_price": 30000,
                "is_weighted": True,
                "unit_label": "kg",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertTrue(res.data["is_weighted"])
        self.assertEqual(res.data["unit_label"], "kg")

    def test_weighted_product_rejects_bundle_on_create(self):
        res = self.client.post(
            self.url,
            {
                "name": "Telur",
                "sell_price": 30000,
                "is_weighted": True,
                "unit_label": "kg",
                "bundle_qty": 10,
                "bundle_price": 250000,
                "bundle_label": "Tray",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_patch_to_weighted_with_existing_bundle_rejected(self):
        product = Product.objects.create(
            tenant=self.tenant,
            name="Gula",
            sell_price=15000,
            bundle_qty=5,
            bundle_price=70000,
            bundle_label="Pak",
        )
        url = reverse("api-v1-product-detail", args=[product.id])
        res = self.client.patch(url, {"is_weighted": True}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_default_unit_label_is_pcs(self):
        res = self.client.post(
            self.url,
            {"name": "Indomie", "sell_price": 3500},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertFalse(res.data["is_weighted"])
        self.assertEqual(res.data["unit_label"], "pcs")
