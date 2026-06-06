from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient

from cashier.models import Cashier, CashierSession
from catalog.models import BarcodeCatalog
from product.models import Product
from store.models import Store
from tenant.models import Tenant

User = get_user_model()


def _make_user(email, password="hunter2hunter2"):
    user = User.objects.create_user(username=email, email=email, password=password)
    tenant = Tenant.objects.create(owner=user, name="My Business")
    return user, tenant


def _make_cashier(store, name="Andi", pin="123456", active=True):
    cashier = Cashier(store=store, display_name=name, active=active)
    cashier.set_pin(pin)
    cashier.save()
    return cashier


def _cashier_client(token):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"CashierToken {token}")
    return client


class CashierProductCreateTests(TestCase):
    def setUp(self):
        self.user, self.tenant = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.cashier = _make_cashier(self.store)
        self.session = CashierSession.issue(self.cashier)
        self.client = _cashier_client(self.session.token)
        self.url = reverse("api-v1-cashier-products")

    def test_cashier_creates_product_for_own_tenant(self):
        res = self.client.post(
            self.url, {"barcode": "111", "name": "Indomie", "sell_price": 3500}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        product = Product.objects.get(id=res.data["id"])
        self.assertEqual(product.tenant, self.tenant)
        self.assertEqual(product.name, "Indomie")
        self.assertEqual(product.sell_price, 3500)
        self.assertIsNone(product.actor)

    def test_create_without_barcode(self):
        res = self.client.post(self.url, {"name": "Kopi", "sell_price": 5000}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIsNone(Product.objects.get(id=res.data["id"]).barcode)

    def test_duplicate_barcode_rejected(self):
        Product.objects.create(tenant=self.tenant, name="Existing", barcode="111", sell_price=1000)
        res = self.client.post(
            self.url, {"barcode": "111", "name": "Dup", "sell_price": 2000}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_requires_cashier_auth(self):
        res = APIClient().post(self.url, {"name": "Kopi", "sell_price": 5000}, format="json")
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class CashierBarcodeLookupTests(TestCase):
    def setUp(self):
        self.user, self.tenant = _make_user("a@b.com")
        self.store = Store.objects.create(tenant=self.tenant, name="Toko A", code="JKT01")
        self.cashier = _make_cashier(self.store)
        self.session = CashierSession.issue(self.cashier)
        self.client = _cashier_client(self.session.token)
        self.url = reverse("api-v1-barcode-lookup")
        BarcodeCatalog.objects.create(barcode="9556041604314", name="A/B TUNA 185G LIGHT")

    def test_cashier_can_lookup_barcode(self):
        res = self.client.get(self.url, {"barcode": "9556041604314"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["name"], "A/B TUNA 185G LIGHT")
