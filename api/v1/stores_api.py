from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1._tenant import require_tenant as _require_tenant
from api.v1.serializers import StoreSerializer
from store.models import Store


class StoresView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant, err = _require_tenant(request.user)
        if err:
            return err
        qs = Store.objects.filter(tenant=tenant)
        return Response(StoreSerializer(qs, many=True).data)

    def post(self, request):
        tenant, err = _require_tenant(request.user)
        if err:
            return err
        serializer = StoreSerializer(data=request.data, context={"tenant": tenant})
        serializer.is_valid(raise_exception=True)
        store = serializer.save(tenant=tenant, actor=request.user)
        return Response(StoreSerializer(store).data, status=status.HTTP_201_CREATED)


class StoreDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_store(self, request, store_id):
        tenant, err = _require_tenant(request.user)
        if err:
            return None, err
        store = get_object_or_404(Store, id=store_id, tenant=tenant)
        return store, None

    def get(self, request, store_id):
        store, err = self._get_store(request, store_id)
        if err:
            return err
        return Response(StoreSerializer(store).data)

    def patch(self, request, store_id):
        store, err = self._get_store(request, store_id)
        if err:
            return err
        serializer = StoreSerializer(
            store,
            data=request.data,
            partial=True,
            context={"tenant": store.tenant},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(actor=request.user)
        return Response(StoreSerializer(store).data)

    def delete(self, request, store_id):
        store, err = self._get_store(request, store_id)
        if err:
            return err
        store.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
