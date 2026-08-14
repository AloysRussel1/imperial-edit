from rest_framework import serializers

from .models import Cart, CartItem, Order, OrderItem, OrderStatusHistory


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
            "fulfillment_status",
        )


class VendorOrderItemSerializer(serializers.ModelSerializer):
    """Ligne de commande vue côté vendeur : contexte commande/client, jamais
    les autres lignes de la même commande (qui peuvent appartenir à un autre
    vendeur) ni les montants globaux de la commande."""

    order_id = serializers.UUIDField(source="order.id", read_only=True)
    order_number = serializers.CharField(source="order.order_number", read_only=True)
    order_created_at = serializers.DateTimeField(source="order.created_at", read_only=True)
    customer_name = serializers.SerializerMethodField()
    fulfillment_status_display = serializers.CharField(source="get_fulfillment_status_display", read_only=True)
    line_total_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)

    class Meta:
        model = OrderItem
        fields = (
            "id",
            "order_id",
            "order_number",
            "order_created_at",
            "customer_name",
            "product_name_snapshot",
            "sku_snapshot",
            "unit_price_xaf",
            "quantity",
            "line_total_xaf",
            "fulfillment_status",
            "fulfillment_status_display",
        )
        read_only_fields = ("fulfillment_status",)  # modifié uniquement via l'action dédiée, pas un PATCH générique

    def get_customer_name(self, obj: OrderItem) -> str:
        customer = obj.order.customer
        full_name = f"{customer.first_name} {customer.last_name}".strip()
        return full_name or customer.email


class OrderStatusHistorySerializer(serializers.ModelSerializer):
    status_display = serializers.CharField(source="get_status_display", read_only=True)

    class Meta:
        model = OrderStatusHistory
        fields = ("id", "status", "status_display", "note", "created_at")


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)
    amount_remaining_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    deposit_due_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    tracking_progress_percent = serializers.IntegerField(read_only=True)
    status_display = serializers.CharField(source="get_status_display", read_only=True)
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_whatsapp = serializers.CharField(source="customer.whatsapp_number", read_only=True)

    class Meta:
        model = Order
        fields = (
            "id",
            "order_number",
            "tracking_number",
            "status",
            "status_display",
            "tracking_progress_percent",
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
            "carrier_notes",
            "estimated_delivery_date",
            "created_at",
            "items",
            "status_history",
        )
        read_only_fields = ("order_number", "tracking_number", "status", "amount_paid_xaf", "total_xaf")

    def get_customer_name(self, obj: Order) -> str:
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email


class OrderTrackingSerializer(serializers.ModelSerializer):
    """
    Vue publique et volontairement restreinte d'une commande : accessible sans
    authentification à quiconque connaît le `tracking_number` (le code fait
    office de "clé" — même logique qu'un suivi de colis postal classique).
    N'expose donc jamais l'e-mail ni le numéro WhatsApp du client.
    """

    status_display = serializers.CharField(source="get_status_display", read_only=True)
    tracking_progress_percent = serializers.IntegerField(read_only=True)
    amount_remaining_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    deposit_due_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    status_history = OrderStatusHistorySerializer(many=True, read_only=True)

    class Meta:
        model = Order
        fields = (
            "order_number",
            "tracking_number",
            "status",
            "status_display",
            "tracking_progress_percent",
            "estimated_delivery_date",
            "delivery_city",
            "shipping_address",
            "currency",
            "total_xaf",
            "amount_paid_xaf",
            "amount_remaining_xaf",
            "deposit_due_xaf",
            "deposit_percentage",
            "carrier_notes",
            "created_at",
            "status_history",
        )


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
