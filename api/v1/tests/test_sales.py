from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cashier.models import Cashier, CashierSession
from product.models import Product
from sale.models import Sale, SaleLine
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


def _make_cashier(store, name="Andi", pin="123456", active=True):
    cashier = Cashier(store=store, display_name=name, active=active)
    cashier.set_pin(pin)
    cashier.save()
    return cashier


def _cashier_client(token):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"CashierToken {token}")
    return client


class CashierStockViewTests(TestCase):
    def setUp(self):
        self.user, self.tenant, _ = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.cashier = _make_cashier(self.store)
        self.session = CashierSession.issue(self.cashier)
        self.url = reverse("api-v1-cashier-stock")

    def test_cashier_can_list_own_store_stock(self):
        record_movement(
            store=self.store,
            product=self.p1,
            delta=8,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        client = _cashier_client(self.session.token)
        res = client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res.data), 1)
        self.assertEqual(res.data[0]["qty"], 8)

    def test_cashier_stock_search(self):
        client = _cashier_client(self.session.token)
        res = client.get(self.url + "?q=indo")
        self.assertEqual(len(res.data), 1)

    def test_admin_token_rejected(self):
        admin_token = Token.objects.get(user=self.user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {admin_token.key}")
        res = client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class SaleCreateTests(TestCase):
    def setUp(self):
        self.user, self.tenant, _ = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.p2 = Product.objects.create(
            tenant=self.tenant, name="Gula", barcode="222", sell_price=15000
        )
        self.cashier = _make_cashier(self.store)
        self.session = CashierSession.issue(self.cashier)
        self.client_ = _cashier_client(self.session.token)
        self.url = reverse("api-v1-cashier-sales-create")
        # seed enough stock
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

    def test_happy_path_creates_sale_lines_and_movements(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [
                    {"product_id": self.p1.id, "qty": 2},
                    {"product_id": self.p2.id, "qty": 1},
                ],
                "tendered": 25000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["subtotal"], 2 * 3500 + 1 * 15000)
        self.assertEqual(res.data["tendered"], 25000)
        self.assertEqual(res.data["change"], 25000 - 22000)
        self.assertEqual(len(res.data["lines"]), 2)
        sale_id = res.data["id"]

        self.assertEqual(Sale.objects.count(), 1)
        self.assertEqual(SaleLine.objects.filter(sale_id=sale_id).count(), 2)

        self.assertEqual(StoreStock.objects.get(store=self.store, product=self.p1).qty, 8)
        self.assertEqual(StoreStock.objects.get(store=self.store, product=self.p2).qty, 4)
        sale_movements = StockMovement.objects.filter(
            store=self.store, reason=StockReason.SALE, ref_type="sale", ref_id=sale_id
        )
        self.assertEqual(sale_movements.count(), 2)
        deltas = sorted(m.delta for m in sale_movements)
        self.assertEqual(deltas, [-2, -1])

    def test_out_of_stock_blocks_and_rolls_back(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [{"product_id": self.p1.id, "qty": 999}],
                "tendered": 10_000_000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("stok tidak cukup", res.data["detail"])
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(SaleLine.objects.count(), 0)
        # stock unchanged
        self.assertEqual(StoreStock.objects.get(store=self.store, product=self.p1).qty, 10)

    def test_insufficient_tender_400(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [{"product_id": self.p1.id, "qty": 2}],
                "tendered": 1000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Sale.objects.count(), 0)

    def test_cross_tenant_product_400(self):
        _, other_tenant, _ = _make_user("z@b.com")
        other_product = Product.objects.create(tenant=other_tenant, name="X", sell_price=100)
        res = self.client_.post(
            self.url,
            {
                "lines": [{"product_id": other_product.id, "qty": 1}],
                "tendered": 1000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Sale.objects.count(), 0)

    def test_duplicate_product_400(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [
                    {"product_id": self.p1.id, "qty": 1},
                    {"product_id": self.p1.id, "qty": 2},
                ],
                "tendered": 100_000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_empty_lines_400(self):
        res = self.client_.post(self.url, {"lines": [], "tendered": 0}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_zero_qty_400(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [{"product_id": self.p1.id, "qty": 0}],
                "tendered": 0,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_unauthenticated_401(self):
        res = APIClient().post(
            self.url,
            {
                "lines": [{"product_id": self.p1.id, "qty": 1}],
                "tendered": 5000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_admin_token_rejected(self):
        admin_token = Token.objects.get(user=self.user)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {admin_token.key}")
        res = client.post(
            self.url,
            {
                "lines": [{"product_id": self.p1.id, "qty": 1}],
                "tendered": 5000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class SaleBundleTests(TestCase):
    def setUp(self):
        self.user, self.tenant, _ = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.bundled = Product.objects.create(
            tenant=self.tenant,
            name="Sachet Kopi",
            barcode="111",
            sell_price=1500,
            bundle_qty=10,
            bundle_price=13000,
            bundle_label="Renteng",
        )
        self.plain = Product.objects.create(
            tenant=self.tenant, name="Gula", barcode="222", sell_price=15000
        )
        self.cashier = _make_cashier(self.store)
        self.session = CashierSession.issue(self.cashier)
        self.client_ = _cashier_client(self.session.token)
        self.url = reverse("api-v1-cashier-sales-create")
        record_movement(
            store=self.store,
            product=self.bundled,
            delta=50,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        record_movement(
            store=self.store,
            product=self.plain,
            delta=5,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )

    def test_bundle_sale_decrements_units_and_snapshots(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [{"product_id": self.bundled.id, "qty": 2, "is_bundle": True}],
                "tendered": 30000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["subtotal"], 2 * 13000)
        line = res.data["lines"][0]
        self.assertTrue(line["is_bundle"])
        self.assertEqual(line["bundle_qty"], 10)
        self.assertEqual(line["bundle_label"], "Renteng")
        self.assertEqual(line["unit_price"], 13000)
        self.assertEqual(
            StoreStock.objects.get(store=self.store, product=self.bundled).qty,
            50 - 2 * 10,
        )
        movement = StockMovement.objects.filter(
            store=self.store, product=self.bundled, reason=StockReason.SALE
        ).first()
        self.assertEqual(movement.delta, -20)

    def test_bundle_on_product_without_bundle_400(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [{"product_id": self.plain.id, "qty": 1, "is_bundle": True}],
                "tendered": 100000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("tidak memiliki bundel", res.data["detail"])
        self.assertEqual(Sale.objects.count(), 0)

    def test_bundle_qty_exceeds_stock_blocks(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [{"product_id": self.bundled.id, "qty": 6, "is_bundle": True}],
                "tendered": 1_000_000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("stok tidak cukup", res.data["detail"])
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(StoreStock.objects.get(store=self.store, product=self.bundled).qty, 50)

    def test_same_product_bundle_and_singular(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [
                    {"product_id": self.bundled.id, "qty": 3},
                    {"product_id": self.bundled.id, "qty": 1, "is_bundle": True},
                ],
                "tendered": 100000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["subtotal"], 3 * 1500 + 1 * 13000)
        self.assertEqual(len(res.data["lines"]), 2)
        self.assertEqual(
            StoreStock.objects.get(store=self.store, product=self.bundled).qty,
            50 - 3 - 10,
        )
        movements = StockMovement.objects.filter(
            store=self.store, product=self.bundled, reason=StockReason.SALE
        )
        self.assertEqual(movements.count(), 2)
        deltas = sorted(m.delta for m in movements)
        self.assertEqual(deltas, [-10, -3])

    def test_same_product_two_singular_rows_400(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [
                    {"product_id": self.bundled.id, "qty": 1},
                    {"product_id": self.bundled.id, "qty": 2},
                ],
                "tendered": 100000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Sale.objects.count(), 0)

    def test_same_product_two_bundle_rows_400(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [
                    {"product_id": self.bundled.id, "qty": 1, "is_bundle": True},
                    {"product_id": self.bundled.id, "qty": 1, "is_bundle": True},
                ],
                "tendered": 100000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(Sale.objects.count(), 0)

    def test_same_product_bundle_plus_singular_oversells(self):
        tiny = Product.objects.create(
            tenant=self.tenant,
            name="Mini",
            barcode="333",
            sell_price=1000,
            bundle_qty=10,
            bundle_price=9000,
            bundle_label="Pak",
        )
        record_movement(
            store=self.store,
            product=tiny,
            delta=10,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        res = self.client_.post(
            self.url,
            {
                "lines": [
                    {"product_id": tiny.id, "qty": 1, "is_bundle": True},
                    {"product_id": tiny.id, "qty": 1},
                ],
                "tendered": 100000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("stok tidak cukup", res.data["detail"])
        self.assertEqual(Sale.objects.count(), 0)
        self.assertEqual(StoreStock.objects.get(store=self.store, product=tiny).qty, 10)

    def test_mixed_bundle_and_single_lines(self):
        res = self.client_.post(
            self.url,
            {
                "lines": [
                    {"product_id": self.bundled.id, "qty": 1, "is_bundle": True},
                    {"product_id": self.plain.id, "qty": 2},
                ],
                "tendered": 100000,
            },
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED, res.data)
        self.assertEqual(res.data["subtotal"], 13000 + 2 * 15000)
        self.assertEqual(StoreStock.objects.get(store=self.store, product=self.bundled).qty, 40)
        self.assertEqual(StoreStock.objects.get(store=self.store, product=self.plain).qty, 3)


class SalesTodayListTests(TestCase):
    def setUp(self):
        self.user, self.tenant, _ = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.cashier_a = _make_cashier(self.store, name="Andi", pin="111111")
        self.cashier_b = _make_cashier(self.store, name="Budi", pin="222222")
        self.session_a = CashierSession.issue(self.cashier_a)
        self.session_b = CashierSession.issue(self.cashier_b)
        record_movement(
            store=self.store,
            product=self.p1,
            delta=20,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        self.url = reverse("api-v1-cashier-sales-today")

    def _make_sale(self, session_token, qty=1, tendered=50000):
        client = _cashier_client(session_token)
        return client.post(
            reverse("api-v1-cashier-sales-create"),
            {
                "lines": [{"product_id": self.p1.id, "qty": qty}],
                "tendered": tendered,
            },
            format="json",
        )

    def test_lists_only_my_sales(self):
        self._make_sale(self.session_a.token, qty=1)
        self._make_sale(self.session_a.token, qty=2)
        self._make_sale(self.session_b.token, qty=3)

        res_a = _cashier_client(self.session_a.token).get(self.url)
        self.assertEqual(res_a.status_code, status.HTTP_200_OK)
        self.assertEqual(len(res_a.data), 2)

        res_b = _cashier_client(self.session_b.token).get(self.url)
        self.assertEqual(len(res_b.data), 1)

    def test_includes_summary_fields(self):
        self._make_sale(self.session_a.token, qty=2, tendered=10000)
        res = _cashier_client(self.session_a.token).get(self.url)
        row = res.data[0]
        self.assertEqual(row["subtotal"], 7000)
        self.assertEqual(row["tendered"], 10000)
        self.assertEqual(row["change"], 3000)
        self.assertEqual(row["line_count"], 1)
        self.assertIn("created_on", row)

    def test_unauthenticated_401(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)
