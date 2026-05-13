from datetime import datetime, time, timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from cashier.models import Cashier, CashierSession
from product.models import Product
from sale.models import Sale
from stock.models import StockReason
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


def _admin_client(token):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


class StoreSalesReportTests(TestCase):
    def setUp(self):
        self.user, self.tenant, self.token = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.p1 = Product.objects.create(
            tenant=self.tenant, name="Indomie", barcode="111", sell_price=3500
        )
        self.p2 = Product.objects.create(
            tenant=self.tenant, name="Gula", barcode="222", sell_price=15000
        )
        self.cashier = _make_cashier(self.store)
        self.session = CashierSession.issue(self.cashier)
        record_movement(
            store=self.store,
            product=self.p1,
            delta=50,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        record_movement(
            store=self.store,
            product=self.p2,
            delta=50,
            reason=StockReason.RECEIVING,
            actor=self.user,
        )
        self.url = reverse("api-v1-store-sales-report", args=[self.store.id])

    def _make_sale(self, lines, tendered=100000):
        client = _cashier_client(self.session.token)
        return client.post(
            reverse("api-v1-cashier-sales-create"),
            {"lines": lines, "tendered": tendered},
            format="json",
        )

    def _backdate(self, sale, target_dt):
        Sale.objects.filter(pk=sale.pk).update(created_on=target_dt)

    def test_requires_auth(self):
        res = APIClient().get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_tenant_isolation(self):
        _, _, other_token = _make_user("z@b.com")
        client = _admin_client(other_token)
        res = client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_default_today(self):
        self._make_sale([{"product_id": self.p1.id, "qty": 2}])
        yesterday_sale_res = self._make_sale([{"product_id": self.p1.id, "qty": 5}])
        yesterday_sale = Sale.objects.get(pk=yesterday_sale_res.data["id"])
        tz = timezone.get_current_timezone()
        yesterday_dt = timezone.make_aware(
            datetime.combine(timezone.localdate() - timedelta(days=1), time(12, 0)),
            tz,
        )
        self._backdate(yesterday_sale, yesterday_dt)

        res = _admin_client(self.token).get(self.url)
        self.assertEqual(res.status_code, status.HTTP_200_OK, res.data)
        self.assertEqual(res.data["summary"]["count"], 1)
        self.assertEqual(res.data["summary"]["items_sold"], 2)

    def test_date_range_filters(self):
        sale_today = self._make_sale([{"product_id": self.p1.id, "qty": 1}])
        sale_2days_res = self._make_sale([{"product_id": self.p1.id, "qty": 3}])
        sale_2days = Sale.objects.get(pk=sale_2days_res.data["id"])
        tz = timezone.get_current_timezone()
        two_days_ago = timezone.localdate() - timedelta(days=2)
        self._backdate(
            sale_2days,
            timezone.make_aware(datetime.combine(two_days_ago, time(10, 0)), tz),
        )

        today = timezone.localdate()
        res = _admin_client(self.token).get(
            self.url,
            {"from": two_days_ago.isoformat(), "to": today.isoformat()},
        )
        self.assertEqual(res.data["summary"]["count"], 2)

        res2 = _admin_client(self.token).get(
            self.url,
            {"from": two_days_ago.isoformat(), "to": two_days_ago.isoformat()},
        )
        self.assertEqual(res2.data["summary"]["count"], 1)
        self.assertEqual(res2.data["sales"][0]["id"], sale_2days.id)
        # current sale not consumed; keep var to avoid unused warning
        self.assertEqual(sale_today.status_code, status.HTTP_201_CREATED)

    def test_summary_aggregates(self):
        self._make_sale(
            [
                {"product_id": self.p1.id, "qty": 2},
                {"product_id": self.p2.id, "qty": 1},
            ]
        )
        self._make_sale([{"product_id": self.p1.id, "qty": 3}])
        res = _admin_client(self.token).get(self.url)
        summary = res.data["summary"]
        self.assertEqual(summary["count"], 2)
        # 2*3500 + 1*15000 + 3*3500 = 7000+15000+10500
        self.assertEqual(summary["gross_revenue"], 32500)
        self.assertEqual(summary["items_sold"], 6)

    def test_top_products_ordering(self):
        self._make_sale(
            [
                {"product_id": self.p1.id, "qty": 5},
                {"product_id": self.p2.id, "qty": 1},
            ]
        )
        self._make_sale([{"product_id": self.p1.id, "qty": 2}])
        res = _admin_client(self.token).get(self.url)
        top = res.data["top_products"]
        self.assertEqual(len(top), 2)
        self.assertEqual(top[0]["product_id"], self.p1.id)
        self.assertEqual(top[0]["qty_sold"], 7)
        self.assertEqual(top[0]["revenue"], 7 * 3500)
        self.assertEqual(top[1]["product_id"], self.p2.id)
        self.assertEqual(top[1]["qty_sold"], 1)

    def test_invalid_date_returns_400(self):
        res = _admin_client(self.token).get(self.url, {"from": "not-a-date"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Tanggal tidak valid")

    def test_invalid_range_returns_400(self):
        today = timezone.localdate()
        yesterday = today - timedelta(days=1)
        res = _admin_client(self.token).get(
            self.url,
            {"from": today.isoformat(), "to": yesterday.isoformat()},
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Rentang tanggal tidak valid")

    def test_csv_export(self):
        self._make_sale(
            [
                {"product_id": self.p1.id, "qty": 2},
                {"product_id": self.p2.id, "qty": 1},
            ]
        )
        self._make_sale([{"product_id": self.p1.id, "qty": 1}])
        res = _admin_client(self.token).get(self.url, {"export": "csv"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertTrue(res["Content-Type"].startswith("text/csv"))
        self.assertIn("attachment", res["Content-Disposition"])
        self.assertIn("JKT01", res["Content-Disposition"])
        body = res.content.decode("utf-8")
        lines = [ln for ln in body.splitlines() if ln]
        # 1 header + 3 sale lines (2 in first sale, 1 in second)
        self.assertEqual(len(lines), 4)
        self.assertIn("sale_id", lines[0])
        self.assertIn("product", lines[0])
