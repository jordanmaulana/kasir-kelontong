from rest_framework import status
from rest_framework.response import Response

from tenant.models import Tenant


def tenant_for(user):
    return Tenant.objects.filter(owner=user).first()


def require_tenant(user):
    tenant = tenant_for(user)
    if tenant is None:
        return None, Response(
            {"detail": "Tenant tidak ditemukan"},
            status=status.HTTP_400_BAD_REQUEST,
        )
    return tenant, None
