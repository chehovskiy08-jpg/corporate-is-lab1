from django.core.exceptions import ValidationError as DjangoValidationError
from django.db import transaction
from django.shortcuts import get_object_or_404
from django.urls import path
from drf_spectacular.utils import extend_schema
from rest_framework import serializers
from rest_framework.generics import GenericAPIView
from rest_framework.response import Response

from catalog.models import Product

from .services import add_to_cart, get_cart, set_quantity


class CartItemSerializer(serializers.Serializer):
    product_id = serializers.IntegerField(source="product.pk")
    name = serializers.CharField(source="product.name")
    slug = serializers.CharField(source="product.slug")
    image = serializers.ImageField(source="product.image", allow_null=True)
    stock = serializers.IntegerField(source="product.stock")
    price = serializers.DecimalField(source="product.price", max_digits=10, decimal_places=2)
    quantity = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)


class CartSerializer(serializers.Serializer):
    items = CartItemSerializer(many=True)
    count = serializers.IntegerField()
    total = serializers.DecimalField(max_digits=12, decimal_places=2)


class AddItemSerializer(serializers.Serializer):
    product = serializers.PrimaryKeyRelatedField(queryset=Product.objects.active())
    quantity = serializers.IntegerField(min_value=1, default=1)


class QuantitySerializer(serializers.Serializer):
    quantity = serializers.IntegerField(min_value=0)


class MergeLineSerializer(serializers.Serializer):
    product = serializers.IntegerField()
    quantity = serializers.IntegerField(min_value=1, max_value=99)


class MergeSerializer(serializers.Serializer):
    items = MergeLineSerializer(many=True)


def cart_response(request, cart):
    cart = type(cart).objects.prefetch_related("items__product").get(pk=cart.pk)
    return Response(CartSerializer(cart, context={"request": request}).data)


class CartView(GenericAPIView):
    serializer_class = CartSerializer

    def get(self, request):
        return cart_response(request, get_cart(request, create=True))


class CartItemsView(GenericAPIView):
    serializer_class = AddItemSerializer

    @extend_schema(responses=CartSerializer)
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_cart(request, create=True)
        add_to_cart(
            cart, serializer.validated_data["product"], serializer.validated_data["quantity"]
        )
        return cart_response(request, cart)


class CartItemDetailView(GenericAPIView):
    serializer_class = QuantitySerializer

    @extend_schema(responses=CartSerializer)
    def patch(self, request, product_id: int):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        cart = get_cart(request, create=True)
        product = get_object_or_404(Product, pk=product_id)
        try:
            set_quantity(cart, product, serializer.validated_data["quantity"])
        except DjangoValidationError as error:
            raise serializers.ValidationError(error.messages) from error
        return cart_response(request, cart)

    @extend_schema(request=None, responses=CartSerializer)
    def delete(self, request, product_id: int):
        cart = get_cart(request, create=True)
        cart.items.filter(product_id=product_id).delete()
        return cart_response(request, cart)


class CartMergeView(GenericAPIView):
    """Переносит в корзину пользователя товары гостевой корзины из браузера."""

    serializer_class = MergeSerializer

    @extend_schema(responses=CartSerializer)
    def post(self, request):
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        lines = serializer.validated_data["items"]
        products = Product.objects.active().in_bulk([line["product"] for line in lines])
        cart = get_cart(request, create=True)
        with transaction.atomic():
            for line in lines:
                product = products.get(line["product"])
                if product is not None:  # снятые с продажи товары просто пропускаем
                    add_to_cart(cart, product, line["quantity"])
        return cart_response(request, cart)


urlpatterns = [
    path("cart/", CartView.as_view(), name="api-cart"),
    path("cart/items/", CartItemsView.as_view(), name="api-cart-items"),
    path("cart/items/<int:product_id>/", CartItemDetailView.as_view(), name="api-cart-item"),
    path("cart/merge/", CartMergeView.as_view(), name="api-cart-merge"),
]
