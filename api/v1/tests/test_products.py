from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from product.models import Product
from stock.models import StockMovement, StockReason, StoreStock
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


class ProductsListCreateTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.url = reverse("api-v1-products")

    def test_list_empty(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["results"], [])
        self.assertEqual(res.data["count"], 0)
        self.assertEqual(res.data["page"], 1)
        self.assertEqual(res.data["total_pages"], 1)

    def test_list_returns_only_own_tenant_products(self):
        Product.objects.create(tenant=self.tenant, name="Indomie", sell_price=3500)
        _, other_tenant, _ = _make_user("z@b.com")
        Product.objects.create(tenant=other_tenant, name="Other", sell_price=1000)
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 1)
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["name"], "Indomie")

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
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["name"], "Indomie Goreng")

    def test_search_by_barcode_substring(self):
        Product.objects.create(
            tenant=self.tenant, name="A", barcode="8992388101012", sell_price=100
        )
        Product.objects.create(tenant=self.tenant, name="B", sell_price=200)
        res = self.client.get(self.url + "?q=88101")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data["results"]), 1)
        self.assertEqual(res.data["results"][0]["name"], "A")

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_pagination_page_and_page_size(self):
        for i in range(25):
            Product.objects.create(tenant=self.tenant, name=f"Item {i:02d}", sell_price=100)
        res = self.client.get(self.url + "?page=1&page_size=10")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["count"], 25)
        self.assertEqual(res.data["page"], 1)
        self.assertEqual(res.data["page_size"], 10)
        self.assertEqual(res.data["total_pages"], 3)
        self.assertEqual(len(res.data["results"]), 10)
        self.assertEqual(res.data["results"][0]["name"], "Item 00")

        res2 = self.client.get(self.url + "?page=3&page_size=10")
        self.assertEqual(res2.data["page"], 3)
        self.assertEqual(len(res2.data["results"]), 5)
        self.assertEqual(res2.data["results"][-1]["name"], "Item 24")

    def test_pagination_clamps_out_of_range_page(self):
        Product.objects.create(tenant=self.tenant, name="One", sell_price=100)
        res = self.client.get(self.url + "?page=9999&page_size=10")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["page"], 1)
        self.assertEqual(len(res.data["results"]), 1)

    def test_pagination_invalid_params_use_defaults(self):
        res = self.client.get(self.url + "?page=abc&page_size=xyz")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["page"], 1)
        self.assertEqual(res.data["page_size"], 20)

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


class InitialStockOnCreateTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.url = reverse("api-v1-products")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko Pusat", code="PUSAT")

    def test_create_product_with_initial_stock(self):
        res = self.client.post(
            self.url,
            {
                "name": "Indomie",
                "sell_price": 3500,
                "initial_store_id": self.store.id,
                "initial_qty": 10,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertNotIn("initial_store_id", res.data)
        self.assertNotIn("initial_qty", res.data)
        product = Product.objects.get(id=res.data["id"])
        stock = StoreStock.objects.get(store=self.store, product=product)
        self.assertEqual(stock.qty, Decimal("10"))
        movements = StockMovement.objects.filter(store=self.store, product=product)
        self.assertEqual(movements.count(), 1)
        movement = movements.get()
        self.assertEqual(movement.reason, StockReason.RECEIVING)
        self.assertEqual(movement.delta, Decimal("10"))
        self.assertEqual(movement.actor_id, self.user.id)
        self.assertEqual(movement.note, "")

    def test_create_product_without_initial_stock_creates_no_movement(self):
        res = self.client.post(
            self.url,
            {"name": "Sabun", "sell_price": 5000},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(StockMovement.objects.count(), 0)
        self.assertEqual(StoreStock.objects.count(), 0)

    def test_initial_qty_without_store_400(self):
        res = self.client.post(
            self.url,
            {"name": "Sabun", "sell_price": 5000, "initial_qty": 5},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("initial_store_id", res.data)
        self.assertEqual(Product.objects.count(), 0)

    def test_initial_store_without_qty_400(self):
        res = self.client.post(
            self.url,
            {"name": "Sabun", "sell_price": 5000, "initial_store_id": self.store.id},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("initial_qty", res.data)
        self.assertEqual(Product.objects.count(), 0)

    def test_initial_stock_rejects_store_from_other_tenant(self):
        _, other_tenant, _ = _make_user("z@b.com")
        other_store = Store.objects.create(tenant=other_tenant, name="Lain", code="LAIN")
        res = self.client.post(
            self.url,
            {
                "name": "Sabun",
                "sell_price": 5000,
                "initial_store_id": other_store.id,
                "initial_qty": 5,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("initial_store_id", res.data)
        self.assertEqual(Product.objects.filter(tenant=self.tenant).count(), 0)
        self.assertEqual(StockMovement.objects.count(), 0)

    def test_initial_qty_decimal_rejected_for_non_weighted(self):
        res = self.client.post(
            self.url,
            {
                "name": "Sabun",
                "sell_price": 5000,
                "initial_store_id": self.store.id,
                "initial_qty": "1.5",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("initial_qty", res.data)
        self.assertEqual(Product.objects.count(), 0)

    def test_initial_qty_decimal_allowed_for_weighted(self):
        res = self.client.post(
            self.url,
            {
                "name": "Telur",
                "sell_price": 30000,
                "is_weighted": True,
                "unit_label": "kg",
                "initial_store_id": self.store.id,
                "initial_qty": "2.5",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        product = Product.objects.get(id=res.data["id"])
        stock = StoreStock.objects.get(store=self.store, product=product)
        self.assertEqual(stock.qty, Decimal("2.5"))

    def test_unknown_initial_store_id_400(self):
        res = self.client.post(
            self.url,
            {
                "name": "Sabun",
                "sell_price": 5000,
                "initial_store_id": "000000000000000000000000",
                "initial_qty": 5,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("initial_store_id", res.data)
        self.assertEqual(Product.objects.count(), 0)

    def test_patch_ignores_initial_stock_fields(self):
        product = Product.objects.create(tenant=self.tenant, name="Sabun", sell_price=5000)
        url = reverse("api-v1-product-detail", args=[product.id])
        res = self.client.patch(
            url,
            {
                "name": "Sabun Mandi",
                "initial_store_id": self.store.id,
                "initial_qty": 5,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(StockMovement.objects.count(), 0)
        self.assertEqual(StoreStock.objects.count(), 0)
