from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1._tenant import require_tenant
from api.v1.serializers import CashierSerializer
from core.models import Cashier, Store


def _get_store(user, store_id):
    tenant, err = require_tenant(user)
    if err:
        return None, err
    store = get_object_or_404(Store, id=store_id, tenant=tenant)
    return store, None


def _get_cashier(user, store_id, cashier_id):
    store, err = _get_store(user, store_id)
    if err:
        return None, err
    cashier = get_object_or_404(Cashier, id=cashier_id, store=store)
    return cashier, None


class CashiersView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id):
        store, err = _get_store(request.user, store_id)
        if err:
            return err
        qs = Cashier.objects.filter(store=store)
        return Response(CashierSerializer(qs, many=True).data)

    def post(self, request, store_id):
        store, err = _get_store(request.user, store_id)
        if err:
            return err
        serializer = CashierSerializer(
            data=request.data, context={"store": store}
        )
        serializer.is_valid(raise_exception=True)
        cashier = serializer.save(actor=request.user)
        return Response(
            CashierSerializer(cashier).data, status=status.HTTP_201_CREATED
        )


class CashierDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, store_id, cashier_id):
        cashier, err = _get_cashier(request.user, store_id, cashier_id)
        if err:
            return err
        return Response(CashierSerializer(cashier).data)

    def patch(self, request, store_id, cashier_id):
        cashier, err = _get_cashier(request.user, store_id, cashier_id)
        if err:
            return err
        serializer = CashierSerializer(
            cashier,
            data=request.data,
            partial=True,
            context={"store": cashier.store},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(actor=request.user)
        return Response(CashierSerializer(cashier).data)

    def delete(self, request, store_id, cashier_id):
        cashier, err = _get_cashier(request.user, store_id, cashier_id)
        if err:
            return err
        cashier.active = False
        cashier.actor = request.user
        cashier.save(update_fields=["active", "actor", "updated_on"])
        return Response(status=status.HTTP_204_NO_CONTENT)
