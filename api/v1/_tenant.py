from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.response import Response

from store.models import Store
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


def require_store(user, store_id):
    tenant, err = require_tenant(user)
    if err:
        return None, err
    store = get_object_or_404(Store, id=store_id, tenant=tenant)
    return store, None
