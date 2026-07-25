from decimal import Decimal

from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import BaseModel
from apps.products.models import ProductVariant


class DepositOption(models.IntegerChoices):
    HALF = 50, "Acompte 50%"
    SEVENTY = 70, "Acompte 70%"
    FULL = 100, "Paiement intégral 100%"


class OrderStatus(models.TextChoices):
    PENDING_DEPOSIT = "pending_deposit", "En attente de paiement de l'acompte"
    DEPOSIT_PAID = "deposit_paid", "Acompte reçu - Commande validée"
    IN_TRANSIT = "in_transit", "En cours d'acheminement Europe -> Cameroun"
    READY_FOR_DELIVERY = "ready_for_delivery", "Arrivé au Cameroun - Prêt pour livraison"
    COMPLETED = "completed", "Solde payé + Colis livré"
    CANCELLED = "cancelled", "Annulé / Expiré"


class PaymentMethod(models.TextChoices):
    MTN_MOMO = "mtn_momo", "MTN Mobile Money"
    ORANGE_MONEY = "orange_money", "Orange Money"
    CARD = "card", "Carte bancaire"


class Cart(BaseModel):
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="carts")
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "carts"


class CartItem(BaseModel):
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="cart_items")
    quantity = models.PositiveIntegerField(default=1, validators=[MinValueValidator(1)])

    class Meta:
        db_table = "cart_items"
        constraints = [models.UniqueConstraint(fields=["cart", "variant"], name="unique_cart_variant")]


class Order(BaseModel):
    order_number = models.CharField(max_length=20, unique=True, editable=False)
    customer = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.PROTECT, related_name="orders")
    status = models.CharField(max_length=30, choices=OrderStatus.choices, default=OrderStatus.PENDING_DEPOSIT)
    currency = models.CharField(max_length=3, default="XAF")
    subtotal_xaf = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    discount_xaf = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    total_xaf = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    deposit_percentage = models.PositiveSmallIntegerField(choices=DepositOption.choices, default=DepositOption.HALF)
    payment_method = models.CharField(max_length=20, choices=PaymentMethod.choices, blank=True)
    amount_paid_xaf = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    coupon_code = models.CharField(max_length=40, blank=True)
    shipping_address = models.TextField(blank=True)
    delivery_city = models.CharField(max_length=100, blank=True)
    reservation_expires_at = models.DateTimeField(null=True, blank=True)
    tracking_notes = models.TextField(blank=True)

    class Meta:
        db_table = "orders"
        indexes = [models.Index(fields=["status"]), models.Index(fields=["order_number"])]

    def __str__(self) -> str:
        return self.order_number

    @property
    def amount_remaining_xaf(self) -> Decimal:
        return max(self.total_xaf - self.amount_paid_xaf, Decimal("0"))

    @property
    def deposit_due_xaf(self) -> Decimal:
        return (self.total_xaf * Decimal(self.deposit_percentage) / Decimal("100")).quantize(Decimal("0.01"))


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="order_items")
    product_name_snapshot = models.CharField(max_length=200)
    sku_snapshot = models.CharField(max_length=64)
    unit_price_xaf = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])

    class Meta:
        db_table = "order_items"

    @property
    def line_total_xaf(self) -> Decimal:
        return self.unit_price_xaf * self.quantity
