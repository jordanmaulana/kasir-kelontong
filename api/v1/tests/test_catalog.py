from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from catalog.models import BarcodeCatalog
from tenant.models import Tenant

User = get_user_model()


def _make_user(email, password="hunter2hunter2"):
    user = User.objects.create_user(username=email, email=email, password=password)
    Tenant.objects.create(owner=user, name="My Business")
    token = Token.objects.create(user=user)
    return user, token


def _client_for(token):
    client = APIClient()
    client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
    return client


class BarcodeLookupTests(TestCase):
    def setUp(self):
        self.user, self.token = _make_user("a@b.com")
        self.client = _client_for(self.token)
        self.url = reverse("api-v1-barcode-lookup")
        BarcodeCatalog.objects.create(barcode="9556041604314", name="A/B TUNA 185G LIGHT")

    def test_lookup_hit(self):
        res = self.client.get(self.url, {"barcode": "9556041604314"})
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data, {"barcode": "9556041604314", "name": "A/B TUNA 185G LIGHT"})

    def test_lookup_miss(self):
        res = self.client.get(self.url, {"barcode": "0000000000000"})
        self.assertEqual(res.status_code, status.HTTP_404_NOT_FOUND)

    def test_lookup_invalid_barcode(self):
        res = self.client.get(self.url, {"barcode": "has spaces!"})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_lookup_empty_barcode(self):
        res = self.client.get(self.url, {"barcode": ""})
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_lookup_requires_auth(self):
        anon = APIClient()
        res = anon.get(self.url, {"barcode": "9556041604314"})
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class ImportCommandTests(TestCase):
    def test_import_idempotent_and_updates(self):
        import tempfile

        from django.core.management import call_command

        with tempfile.NamedTemporaryFile("w", suffix=".csv", delete=False) as f:
            f.write("barcode,name\n")
            f.write("111,One\n")
            f.write("222,Two\n")
            f.write(",NoBarcode\n")
            f.write("bad code,WithSpace\n")
            path = f.name

        call_command("import_barcode_catalog", path)
        self.assertEqual(BarcodeCatalog.objects.count(), 2)
        self.assertEqual(BarcodeCatalog.objects.get(pk="111").name, "One")

        with open(path, "w") as f:
            f.write("barcode,name\n")
            f.write("111,One Updated\n")
            f.write("333,Three\n")

        call_command("import_barcode_catalog", path)
        self.assertEqual(BarcodeCatalog.objects.count(), 3)
        self.assertEqual(BarcodeCatalog.objects.get(pk="111").name, "One Updated")
        self.assertEqual(BarcodeCatalog.objects.get(pk="333").name, "Three")
