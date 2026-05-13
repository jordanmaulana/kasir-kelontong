from profile.models import Profile

from django.contrib.auth import get_user_model
from django.db import transaction
from rest_framework import status
from rest_framework.authtoken.models import Token
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response

from api.v1.serializers import (
    GoogleAuthSerializer,
    LoginSerializer,
    RegisterSerializer,
    StoreSerializer,
    UserSerializer,
)
from tenant.models import Tenant

User = get_user_model()


@api_view(["POST"])
@permission_classes([AllowAny])
def register(request):
    serializer = RegisterSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"]
    password = serializer.validated_data["password"]
    with transaction.atomic():
        user = User(username=email, email=email)
        user.set_password(password)
        user.save()
        Profile.objects.create(user=user)
        Tenant.objects.create(owner=user, name="My Business")
        token = Token.objects.create(user=user)
    return Response(
        {"token": token.key, "user": UserSerializer(user).data},
        status=status.HTTP_201_CREATED,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    email = serializer.validated_data["email"].lower()
    password = serializer.validated_data["password"]
    user = User.objects.filter(username__iexact=email).first()
    if user is None or not user.check_password(password):
        return Response(
            {"detail": "Email atau kata sandi salah"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {"token": token.key, "user": UserSerializer(user).data},
        status=status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([AllowAny])
def google(request):
    serializer = GoogleAuthSerializer(data=request.data)
    serializer.is_valid(raise_exception=True)
    claims = serializer.validated_data["claims"]
    email = claims["email"].lower()
    with transaction.atomic():
        user = User.objects.filter(username__iexact=email).first()
        created = user is None
        if user is None:
            user = User.objects.create(username=email, email=email)
            user.set_unusable_password()
            user.save(update_fields=["password"])
        Profile.objects.get_or_create(user=user)
        Tenant.objects.get_or_create(owner=user, defaults={"name": "My Business"})
        token, _ = Token.objects.get_or_create(user=user)
    return Response(
        {"token": token.key, "user": UserSerializer(user).data},
        status=status.HTTP_201_CREATED if created else status.HTTP_200_OK,
    )


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def logout(request):
    Token.objects.filter(user=request.user).delete()
    return Response(status=status.HTTP_204_NO_CONTENT)


@api_view(["GET"])
@permission_classes([IsAuthenticated])
def me(request):
    return Response(UserSerializer(request.user).data)


@api_view(["POST"])
@permission_classes([IsAuthenticated])
def complete_onboarding(request):
    profile, _ = Profile.objects.get_or_create(user=request.user)
    if profile.onboarded:
        return Response(
            {"detail": "Onboarding sudah selesai"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    tenant = Tenant.objects.filter(owner=request.user).first()
    if tenant is None:
        return Response(
            {"detail": "Tenant tidak ditemukan"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    serializer = StoreSerializer(data=request.data, context={"tenant": tenant})
    serializer.is_valid(raise_exception=True)
    with transaction.atomic():
        store = serializer.save(tenant=tenant, actor=request.user)
        profile.onboarded = True
        profile.save(update_fields=["onboarded", "updated_on"])
    return Response(
        {
            "user": UserSerializer(request.user).data,
            "store": StoreSerializer(store).data,
        },
        status=status.HTTP_201_CREATED,
    )
