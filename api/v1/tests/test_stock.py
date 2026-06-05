from decimal import Decimal

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from product.models import Product
from stock.models import StockMovement, StockReason, StoreStock
from stock.services import record_movement
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


class StockListTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.p2 = Product.objects.create(
            tenant=self.tenant, name="Gula", barcode="222", sell_price=15000
        )
        self.url = reverse("api-v1-store-stock", args=[self.store.id])

    def test_empty_store_returns_zero_qty_for_all_products(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 2)
        for row in res.data:
            self.assertEqual(row["qty"], 0)
            self.assertIsNone(row["last_movement_at"])

    def test_stock_reflects_movements(self):
        record_movement(
            store=self.store,
            product=self.p1,
            delta=10,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        res = self.client.get(self.url)
        row = next(r for r in res.data if r["product_id"] == self.p1.id)
        self.assertEqual(row["qty"], 10)
        self.assertIsNotNone(row["last_movement_at"])

    def test_q_filters_products(self):
        res = self.client.get(self.url + "?q=indo")
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["name"], "Indomie")

    def test_tenant_isolation(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).get(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class ReceivingTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.p2 = Product.objects.create(
            tenant=self.tenant, name="Gula", barcode="222", sell_price=15000
        )
        self.url = reverse("api-v1-store-receiving", args=[self.store.id])

    def test_receiving_creates_movements_and_updates_cache(self):
        res = self.client.post(
            self.url,
            {
                "items": [
                    {"product_id": self.p1.id, "qty": 5},
                    {"product_id": self.p2.id, "qty": 3},
                ]
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(len(res.data), 2)
        self.assertEqual(StockMovement.objects.filter(store=self.store).count(), 2)
        s1 = StoreStock.objects.get(store=self.store, product=self.p1)
        s2 = StoreStock.objects.get(store=self.store, product=self.p2)
        self.assertEqual(s1.qty, 5)
        self.assertEqual(s2.qty, 3)
        for m in StockMovement.objects.filter(store=self.store):
            self.assertEqual(m.reason, StockReason.RECEIVING)
            self.assertEqual(m.actor, self.user)

    def test_receiving_accumulates_on_repeat(self):
        for _ in range(3):
            self.client.post(
                self.url,
                {"items": [{"product_id": self.p1.id, "qty": 4}]},
                format="json",
            )
        s = StoreStock.objects.get(store=self.store, product=self.p1)
        self.assertEqual(s.qty, 12)

    def test_receiving_empty_items_400(self):
        res = self.client.post(self.url, {"items": []}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_receiving_zero_qty_400(self):
        res = self.client.post(
            self.url,
            {"items": [{"product_id": self.p1.id, "qty": 0}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_receiving_negative_qty_400(self):
        res = self.client.post(
            self.url,
            {"items": [{"product_id": self.p1.id, "qty": -1}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_receiving_duplicate_product_400(self):
        res = self.client.post(
            self.url,
            {
                "items": [
                    {"product_id": self.p1.id, "qty": 5},
                    {"product_id": self.p1.id, "qty": 3},
                ]
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_receiving_cross_tenant_product_400(self):
        _, other_tenant, _ = _make_user("z@b.com")
        other_product = Product.objects.create(tenant=other_tenant, name="X", sell_price=100)
        res = self.client.post(
            self.url,
            {"items": [{"product_id": other_product.id, "qty": 5}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_tenant_isolation_404(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).post(
            self.url,
            {"items": [{"product_id": self.p1.id, "qty": 5}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class AdjustmentTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.url = reverse("api-v1-store-adjustment", args=[self.store.id])

    def _seed(self, qty):
        record_movement(
            store=self.store,
            product=self.p1,
            delta=qty,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )

    def test_adjust_with_target_qty_above(self):
        self._seed(5)
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "target_qty": 10, "note": "stok masuk"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["delta"], 5)
        s = StoreStock.objects.get(store=self.store, product=self.p1)
        self.assertEqual(s.qty, 10)

    def test_adjust_with_target_qty_below(self):
        self._seed(5)
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "target_qty": 2, "note": "hilang"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["delta"], -3)
        s = StoreStock.objects.get(store=self.store, product=self.p1)
        self.assertEqual(s.qty, 2)

    def test_adjust_with_delta(self):
        self._seed(5)
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "delta": -3, "note": "rusak"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        s = StoreStock.objects.get(store=self.store, product=self.p1)
        self.assertEqual(s.qty, 2)

    def test_adjust_missing_note_400(self):
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "delta": 1},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjust_blank_note_400(self):
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "delta": 1, "note": "   "},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjust_both_delta_and_target_400(self):
        res = self.client.post(
            self.url,
            {
                "product_id": self.p1.id,
                "delta": 1,
                "target_qty": 5,
                "note": "x",
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjust_neither_delta_nor_target_400(self):
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "note": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjust_zero_delta_400(self):
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "delta": 0, "note": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjust_target_same_as_current_400(self):
        self._seed(5)
        res = self.client.post(
            self.url,
            {"product_id": self.p1.id, "target_qty": 5, "note": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_adjust_cross_tenant_product_400(self):
        _, other_tenant, _ = _make_user("z@b.com")
        other_product = Product.objects.create(tenant=other_tenant, name="X", sell_price=100)
        res = self.client.post(
            self.url,
            {"product_id": other_product.id, "delta": 1, "note": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class MovementsListTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.p2 = Product.objects.create(
            tenant=self.tenant, name="Gula", barcode="222", sell_price=15000
        )
        record_movement(
            store=self.store,
            product=self.p1,
            delta=10,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        record_movement(
            store=self.store,
            product=self.p2,
            delta=5,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        record_movement(
            store=self.store,
            product=self.p1,
            delta=-2,
            reason=StockReason.ADJUSTMENT,
            actor=self.user,
            note="rusak",
        )
        self.url = reverse("api-v1-store-movements", args=[self.store.id])

    def test_list_all(self):
        res = self.client.get(self.url)
        self.assertEqual(len(res.data), 3)

    def test_filter_by_product(self):
        res = self.client.get(self.url + f"?product={self.p1.id}")
        self.assertEqual(len(res.data), 2)

    def test_filter_by_reason(self):
        res = self.client.get(self.url + "?reason=adjustment")
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["delta"], -2)

    def test_tenant_isolation(self):
        _, _, other_token = _make_user("z@b.com")
        res = _client_for(other_token).get(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)


class ServiceLayerTests(TestCase):
    def setUp(self):
        self.user, self.tenant, _ = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.product = Product.objects.create(tenant=self.tenant, name="Indomie", sell_price=3500)

    def test_sale_below_zero_allowed(self):
        # overselling is allowed — stock simply goes negative
        record_movement(
            store=self.store,
            product=self.product,
            delta=-1,
            reason=StockReason.SALE,
            actor=self.user,
        )
        self.assertTrue(StockMovement.objects.filter(store=self.store).exists())
        s = StoreStock.objects.get(store=self.store, product=self.product)
        self.assertEqual(s.qty, -1)

    def test_cross_tenant_raises(self):
        _, other_tenant, _ = _make_user("z@b.com")
        other_store = Store.objects.create(tenant=other_tenant, name="X", code="BDG01")
        with self.assertRaises(ValueError):
            record_movement(
                store=other_store,
                product=self.product,
                delta=1,
                reason=StockReason.RECEIVING,
                actor=self.user,
            )

    def test_sale_at_zero_allowed(self):
        record_movement(
            store=self.store,
            product=self.product,
            delta=5,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        record_movement(
            store=self.store,
            product=self.product,
            delta=-5,
            reason=StockReason.SALE,
            actor=self.user,
        )
        s = StoreStock.objects.get(store=self.store, product=self.product)
        self.assertEqual(s.qty, 0)


class WeightedStockTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.egg = Product.objects.create(
            tenant=self.tenant,
            name="Telur",
            barcode="EGG1",
            sell_price=30000,
            is_weighted=True,
            unit_label="kg",
        )
        self.plain = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )

    def test_receiving_weighted_decimal_qty(self):
        url = reverse("api-v1-store-receiving", args=[self.store.id])
        res = self.client.post(
            url,
            {"items": [{"product_id": self.egg.id, "qty": "2.5"}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        s = StoreStock.objects.get(store=self.store, product=self.egg)
        self.assertEqual(s.qty, Decimal("2.50"))

    def test_receiving_non_weighted_rejects_decimal(self):
        url = reverse("api-v1-store-receiving", args=[self.store.id])
        res = self.client.post(
            url,
            {"items": [{"product_id": self.plain.id, "qty": "1.5"}]},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertFalse(StockMovement.objects.exists())

    def test_adjust_weighted_target_decimal(self):
        record_movement(
            store=self.store,
            product=self.egg,
            delta=Decimal("5.00"),
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        url = reverse("api-v1-store-adjustment", args=[self.store.id])
        res = self.client.post(
            url,
            {"product_id": self.egg.id, "target_qty": "1.75", "note": "stok opname"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        s = StoreStock.objects.get(store=self.store, product=self.egg)
        self.assertEqual(s.qty, Decimal("1.75"))

    def test_adjust_non_weighted_rejects_decimal_delta(self):
        record_movement(
            store=self.store,
            product=self.plain,
            delta=5,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        url = reverse("api-v1-store-adjustment", args=[self.store.id])
        res = self.client.post(
            url,
            {"product_id": self.plain.id, "delta": "0.5", "note": "x"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_stock_list_returns_is_weighted_and_unit_label(self):
        url = reverse("api-v1-store-stock", args=[self.store.id])
        res = self.client.get(url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        egg_row = next(r for r in res.data if r["product_id"] == self.egg.id)
        self.assertTrue(egg_row["is_weighted"])
        self.assertEqual(egg_row["unit_label"], "kg")
        plain_row = next(r for r in res.data if r["product_id"] == self.plain.id)
        self.assertFalse(plain_row["is_weighted"])
        self.assertEqual(plain_row["unit_label"], "pcs")
