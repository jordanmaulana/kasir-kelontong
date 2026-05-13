from django.db.models import Q
from django.shortcuts import get_object_or_404
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from api.v1._tenant import require_tenant as _require_tenant
from api.v1.serializers import ProductSerializer
from product.models import Product


class ProductsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        tenant, err = _require_tenant(request.user)
        if err:
            return err
        qs = Product.objects.filter(tenant=tenant)
        q = request.query_params.get("q", "").strip()
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(barcode__icontains=q))
        return Response(ProductSerializer(qs, many=True).data)

    def post(self, request):
        tenant, err = _require_tenant(request.user)
        if err:
            return err
        serializer = ProductSerializer(data=request.data, context={"tenant": tenant})
        serializer.is_valid(raise_exception=True)
        product = serializer.save(tenant=tenant, actor=request.user)
        return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)


class ProductDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def _get_product(self, request, product_id):
        tenant, err = _require_tenant(request.user)
        if err:
            return None, err
        product = get_object_or_404(Product, id=product_id, tenant=tenant)
        return product, None

    def get(self, request, product_id):
        product, err = self._get_product(request, product_id)
        if err:
            return err
        return Response(ProductSerializer(product).data)

    def patch(self, request, product_id):
        product, err = self._get_product(request, product_id)
        if err:
            return err
        serializer = ProductSerializer(
            product,
            data=request.data,
            partial=True,
            context={"tenant": product.tenant},
        )
        serializer.is_valid(raise_exception=True)
        serializer.save(actor=request.user)
        return Response(ProductSerializer(product).data)

    def delete(self, request, product_id):
        product, err = self._get_product(request, product_id)
        if err:
            return err
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
