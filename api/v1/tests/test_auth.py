from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from profile.models import Profile
from store.models import Store
from tenant.models import Tenant

User = get_user_model()


class RegisterTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-auth-register")

    def test_201_returns_token_and_user(self):
        res = self.client.post(
            self.url,
            {"email": "a@b.com", "password": "hunter2hunter2"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", res.data)
        self.assertEqual(res.data["user"]["email"], "a@b.com")
        self.assertFalse(res.data["user"]["onboarded"])
        user = User.objects.get(username="a@b.com")
        self.assertTrue(user.check_password("hunter2hunter2"))
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertTrue(Token.objects.filter(user=user).exists())

    def test_duplicate_email_case_insensitive_400(self):
        User.objects.create_user(username="a@b.com", email="a@b.com", password="pw12345678")
        res = self.client.post(
            self.url,
            {"email": "A@B.com", "password": "hunter2hunter2"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)

    def test_weak_password_400(self):
        res = self.client.post(
            self.url,
            {"email": "a@b.com", "password": "123"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", res.data)


class LoginTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-auth-login")
        self.user = User.objects.create_user(
            username="a@b.com", email="a@b.com", password="hunter2hunter2"
        )
        Profile.objects.create(user=self.user)

    def test_success_returns_token(self):
        res = self.client.post(
            self.url,
            {"email": "A@B.com", "password": "hunter2hunter2"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertIn("token", res.data)
        self.assertEqual(res.data["user"]["email"], "a@b.com")

    def test_wrong_password_400(self):
        res = self.client.post(
            self.url,
            {"email": "a@b.com", "password": "wrongpassword"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Email atau kata sandi salah")

    def test_unknown_email_400(self):
        res = self.client.post(
            self.url,
            {"email": "ghost@b.com", "password": "hunter2hunter2"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Email atau kata sandi salah")


class MeTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username="a@b.com", email="a@b.com", password="hunter2hunter2"
        )
        Profile.objects.create(user=self.user)
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_me_returns_onboarded_false(self):
        res = self.client.get(reverse("api-v1-me"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(res.data["email"], "a@b.com")
        self.assertFalse(res.data["onboarded"])

    def test_me_returns_onboarded_true_when_flag_set(self):
        self.user.profile.onboarded = True
        self.user.profile.save()
        res = self.client.get(reverse("api-v1-me"))
        self.assertTrue(res.data["onboarded"])

    def test_me_no_profile_returns_false(self):
        legacy = User.objects.create_user(
            username="legacy@b.com", email="legacy@b.com", password="hunter2hunter2"
        )
        token = Token.objects.create(user=legacy)
        client = APIClient()
        client.credentials(HTTP_AUTHORIZATION=f"Token {token.key}")
        res = client.get(reverse("api-v1-me"))
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertFalse(res.data["onboarded"])


class MeAuthTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-me")

    def test_me_unauthenticated_401(self):
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_invalid_token_401(self):
        self.client.credentials(HTTP_AUTHORIZATION="Token bogus")
        res = self.client.get(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class LogoutTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-logout")
        self.user = User.objects.create_user(
            username="a@b.com", email="a@b.com", password="hunter2hunter2"
        )
        self.token = Token.objects.create(user=self.user)

    def test_logout_204_deletes_token(self):
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_204_NO_CONTENT)
        self.assertFalse(Token.objects.filter(user=self.user).exists())

    def test_logout_unauthenticated_401(self):
        res = self.client.post(self.url)
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


@override_settings(GOOGLE_OAUTH_CLIENT_ID="test-client-id")
class GoogleTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-auth-google")

    @patch("api.v1.serializers.id_token.verify_oauth2_token")
    def test_new_user_201_creates_user_profile_token(self, mock_verify):
        mock_verify.return_value = {"email": "new@b.com", "email_verified": True}
        res = self.client.post(self.url, {"credential": "fake-jwt"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertIn("token", res.data)
        self.assertEqual(res.data["user"]["email"], "new@b.com")
        user = User.objects.get(username="new@b.com")
        self.assertTrue(Profile.objects.filter(user=user).exists())
        self.assertTrue(Token.objects.filter(user=user).exists())
        self.assertFalse(user.has_usable_password())

    @patch("api.v1.serializers.id_token.verify_oauth2_token")
    def test_existing_user_200_reuses_user(self, mock_verify):
        user = User.objects.create_user(
            username="a@b.com", email="a@b.com", password="hunter2hunter2"
        )
        Profile.objects.create(user=user)
        mock_verify.return_value = {"email": "a@b.com", "email_verified": True}
        res = self.client.post(self.url, {"credential": "fake-jwt"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.filter(username="a@b.com").count(), 1)
        self.assertIn("token", res.data)

    @patch("api.v1.serializers.id_token.verify_oauth2_token")
    def test_existing_user_case_insensitive(self, mock_verify):
        user = User.objects.create_user(
            username="a@b.com", email="a@b.com", password="hunter2hunter2"
        )
        Profile.objects.create(user=user)
        mock_verify.return_value = {"email": "A@B.com", "email_verified": True}
        res = self.client.post(self.url, {"credential": "fake-jwt"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.assertEqual(User.objects.filter(username__iexact="a@b.com").count(), 1)

    @patch("api.v1.serializers.id_token.verify_oauth2_token")
    def test_unverified_email_400(self, mock_verify):
        mock_verify.return_value = {"email": "x@b.com", "email_verified": False}
        res = self.client.post(self.url, {"credential": "fake-jwt"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    @patch("api.v1.serializers.id_token.verify_oauth2_token")
    def test_invalid_credential_400(self, mock_verify):
        mock_verify.side_effect = ValueError("bad token")
        res = self.client.post(self.url, {"credential": "fake-jwt"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)

    def test_missing_credential_400(self):
        res = self.client.post(self.url, {}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("credential", res.data)


class GoogleNotConfiguredTests(TestCase):
    @override_settings(GOOGLE_OAUTH_CLIENT_ID="")
    def test_google_not_configured_400(self):
        client = APIClient()
        res = client.post(
            reverse("api-v1-auth-google"),
            {"credential": "anything"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)


class RegisterValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-auth-register")

    def test_missing_email_400(self):
        res = self.client.post(self.url, {"password": "hunter2hunter2"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)

    def test_missing_password_400(self):
        res = self.client.post(self.url, {"email": "a@b.com"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", res.data)

    def test_invalid_email_format_400(self):
        res = self.client.post(
            self.url,
            {"email": "notanemail", "password": "hunter2hunter2"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)


class OnboardingTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-auth-onboarding")
        self.user = User.objects.create_user(
            username="a@b.com", email="a@b.com", password="hunter2hunter2"
        )
        self.profile = Profile.objects.create(user=self.user)
        self.tenant = Tenant.objects.create(owner=self.user, name="My Business")
        self.token = Token.objects.create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f"Token {self.token.key}")

    def test_success_creates_store_and_flips_onboarded(self):
        res = self.client.post(
            self.url,
            {"name": "Toko Pusat", "code": "JKT01", "address": "Jl. 1"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertTrue(res.data["user"]["onboarded"])
        self.assertEqual(res.data["store"]["code"], "JKT01")
        self.profile.refresh_from_db()
        self.assertTrue(self.profile.onboarded)
        self.assertTrue(
            Store.objects.filter(tenant=self.tenant, code="JKT01").exists()
        )

    def test_lowercase_code_normalized(self):
        res = self.client.post(
            self.url, {"name": "Toko", "code": "jkt01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_201_CREATED)
        self.assertEqual(res.data["store"]["code"], "JKT01")

    def test_already_onboarded_400(self):
        self.profile.onboarded = True
        self.profile.save()
        res = self.client.post(
            self.url, {"name": "Toko", "code": "JKT01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Onboarding sudah selesai")
        self.assertFalse(Store.objects.filter(tenant=self.tenant).exists())

    def test_missing_tenant_400(self):
        self.tenant.delete()
        res = self.client.post(
            self.url, {"name": "Toko", "code": "JKT01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Tenant tidak ditemukan")

    def test_invalid_code_rolls_back(self):
        res = self.client.post(
            self.url, {"name": "Toko", "code": "JK"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("code", res.data)
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.onboarded)
        self.assertFalse(Store.objects.filter(tenant=self.tenant).exists())

    def test_missing_name_400(self):
        res = self.client.post(self.url, {"code": "JKT01"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("name", res.data)
        self.profile.refresh_from_db()
        self.assertFalse(self.profile.onboarded)

    def test_unauthenticated_401(self):
        client = APIClient()
        res = client.post(
            self.url, {"name": "Toko", "code": "JKT01"}, format="json"
        )
        self.assertEqual(res.status_code, status.HTTP_401_UNAUTHORIZED)


class LoginValidationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse("api-v1-auth-login")

    def test_missing_email_400(self):
        res = self.client.post(self.url, {"password": "hunter2hunter2"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("email", res.data)

    def test_missing_password_400(self):
        res = self.client.post(self.url, {"email": "a@b.com"}, format="json")
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("password", res.data)
