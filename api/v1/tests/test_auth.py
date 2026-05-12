from django.contrib.auth import get_user_model
from django.test import TestCase
from django.urls import reverse
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.test import APIClient

from core.models import Profile

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
        self.assertEqual(res.data["detail"], "Invalid credentials")

    def test_unknown_email_400(self):
        res = self.client.post(
            self.url,
            {"email": "ghost@b.com", "password": "hunter2hunter2"},
            format="json",
        )
        self.assertEqual(res.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(res.data["detail"], "Invalid credentials")


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
