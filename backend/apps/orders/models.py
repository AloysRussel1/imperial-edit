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
    PENDING_DEPOSIT = "pending_deposit", "En attente d'acompte"
    DEPOSIT_PAID = "deposit_paid", "Acompte payé & Commande validée"
    SOURCING_IN_PROGRESS = "sourcing_in_progress", "Achat en cours en Europe (Paris / Milan / Londres)"
    SHIPPED_FROM_EUROPE = "shipped_from_europe", "Expédié depuis l'Europe"
    ARRIVED_IN_CAMEROON = "arrived_in_cameroon", "Disponible en agence au Cameroun"
    DELIVERED_AND_COMPLETED = "delivered_and_completed", "Livré au client & Solde réglé"
    CANCELLED = "cancelled", "Annulé / Expiré"


# Frise chronologique client (5 grandes étapes) : la commande "en attente d'acompte"
# précède ce parcours et "annulé" en est l'exception — ni l'une ni l'autre n'a de
# position dans la frise elle-même. Sert au calcul de la progression (%).
TRACKING_MILESTONES = [
    OrderStatus.DEPOSIT_PAID,
    OrderStatus.SOURCING_IN_PROGRESS,
    OrderStatus.SHIPPED_FROM_EUROPE,
    OrderStatus.ARRIVED_IN_CAMEROON,
    OrderStatus.DELIVERED_AND_COMPLETED,
]


class PaymentMethod(models.TextChoices):
    MTN_MOMO = "mtn_momo", "MTN Mobile Money"
    ORANGE_MONEY = "orange_money", "Orange Money"
    CARD = "card", "Carte bancaire"
    CASH = "cash", "Espèces"


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
    tracking_number = models.CharField(max_length=32, unique=True, editable=False, null=True, blank=True)
    carrier_notes = models.TextField(
        blank=True, help_text="Ex. « Colis dédouané à l'aéroport de Douala »."
    )
    estimated_delivery_date = models.DateField(null=True, blank=True)

    class Meta:
        db_table = "orders"
        indexes = [
            models.Index(fields=["status"]),
            models.Index(fields=["order_number"]),
            models.Index(fields=["tracking_number"]),
        ]

    def __str__(self) -> str:
        return self.order_number

    @property
    def amount_remaining_xaf(self) -> Decimal:
        return max(self.total_xaf - self.amount_paid_xaf, Decimal("0"))

    @property
    def deposit_due_xaf(self) -> Decimal:
        return (self.total_xaf * Decimal(self.deposit_percentage) / Decimal("100")).quantize(Decimal("0.01"))

    @property
    def tracking_progress_percent(self) -> int:
        if self.status not in TRACKING_MILESTONES:
            return 0
        return round((TRACKING_MILESTONES.index(self.status) + 1) / len(TRACKING_MILESTONES) * 100)


class OrderItemFulfillmentStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    PREPARING = "preparing", "En préparation"
    SHIPPED = "shipped", "Expédié"


class OrderItem(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    variant = models.ForeignKey(ProductVariant, on_delete=models.PROTECT, related_name="order_items")
    product_name_snapshot = models.CharField(max_length=200)
    sku_snapshot = models.CharField(max_length=64)
    unit_price_xaf = models.DecimalField(max_digits=12, decimal_places=2)
    quantity = models.PositiveIntegerField(validators=[MinValueValidator(1)])
    # Statut de préparation côté vendeur, distinct du statut global de la
    # commande (Order.status, piloté par record_status_change()) : une
    # commande peut mélanger des articles de plusieurs vendeurs, chacun ne
    # devant contrôler que la préparation de SES propres lignes, jamais
    # l'état d'ensemble de la commande (paiement, livraison finale...).
    fulfillment_status = models.CharField(
        max_length=20, choices=OrderItemFulfillmentStatus.choices, default=OrderItemFulfillmentStatus.PENDING
    )

    class Meta:
        db_table = "order_items"

    @property
    def line_total_xaf(self) -> Decimal:
        return self.unit_price_xaf * self.quantity


class OrderStatusHistory(BaseModel):
    """Horodatage de chaque changement de statut — alimente la frise chronologique client."""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="status_history")
    status = models.CharField(max_length=30, choices=OrderStatus.choices)
    note = models.TextField(blank=True)
    changed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.SET_NULL, null=True, blank=True, related_name="+"
    )

    class Meta:
        db_table = "order_status_history"
        ordering = ["created_at"]
        verbose_name_plural = "order status history"

    def __str__(self) -> str:
        return f"{self.order.order_number} → {self.status}"
