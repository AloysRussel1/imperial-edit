from rest_framework import serializers

from .models import Cart, CartItem, Order, OrderItem


class CartItemSerializer(serializers.ModelSerializer):
    class Meta:
        model = CartItem
        fields = ("id", "variant", "quantity")


class CartSerializer(serializers.ModelSerializer):
    items = CartItemSerializer(many=True, read_only=True)

    class Meta:
        model = Cart
        fields = ("id", "is_active", "items")


class OrderItemSerializer(serializers.ModelSerializer):
    line_total_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "variant",
            "product_name_snapshot",
            "sku_snapshot",
            "unit_price_xaf",
            "quantity",
            "line_total_xaf",
        )


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    amount_remaining_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    deposit_due_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_whatsapp = serializers.CharField(source="customer.whatsapp_number", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "status",
            "currency",
            "customer_name",
            "customer_email",
            "customer_whatsapp",
            "subtotal_xaf",
            "discount_xaf",
            "total_xaf",
            "deposit_percentage",
            "payment_method",
            "amount_paid_xaf",
            "amount_remaining_xaf",
            "deposit_due_xaf",
            "coupon_code",
            "shipping_address",
            "delivery_city",
            "tracking_notes",
            "created_at",
            "items",
        )
        read_only_fields = ("order_number", "status", "amount_paid_xaf", "total_xaf")

    def get_customer_name(self, obj: Order) -> str:
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email


class CreateOrderSerializer(serializers.Serializer):
    cart_id = serializers.UUIDField()
    deposit_percentage = serializers.ChoiceField(choices=[50, 70, 100])
    shipping_address = serializers.CharField()
    delivery_city = serializers.CharField()
    coupon_code = serializers.CharField(required=False, allow_blank=True)


class CheckoutItemSerializer(serializers.Serializer):
    variant_id = serializers.UUIDField()
    quantity = serializers.IntegerField(min_value=1)


class CheckoutSerializer(serializers.Serializer):
    """Création de commande directement depuis le panier côté client (pas de
    panier persistant côté serveur pour cette boutique)."""

    items = CheckoutItemSerializer(many=True)
    deposit_percentage = serializers.ChoiceField(choices=[50, 70, 100])
    shipping_address = serializers.CharField()
    delivery_city = serializers.CharField()
    payment_method = serializers.ChoiceField(choices=["mtn_momo", "orange_money", "card"], required=False)
