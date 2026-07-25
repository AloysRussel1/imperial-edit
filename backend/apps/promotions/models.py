from decimal import Decimal

from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import BaseModel


class DiscountType(models.TextChoices):
    PERCENTAGE = "percentage", "Pourcentage"
    FIXED_AMOUNT = "fixed_amount", "Montant fixe (XAF)"


class Coupon(BaseModel):
    code = models.CharField(max_length=40, unique=True)
    discount_type = models.CharField(max_length=20, choices=DiscountType.choices)
    discount_value = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    minimum_amount_xaf = models.DecimalField(max_digits=12, decimal_places=2, default=Decimal("0"))
    max_uses = models.PositiveIntegerField(null=True, blank=True)
    times_used = models.PositiveIntegerField(default=0)
    valid_from = models.DateTimeField()
    valid_until = models.DateTimeField()
    is_active = models.BooleanField(default=True)

    class Meta:
        db_table = "coupons"

    def __str__(self) -> str:
        return self.code

    def compute_discount(self, subtotal_xaf: Decimal) -> Decimal:
        if self.discount_type == DiscountType.PERCENTAGE:
            return (subtotal_xaf * self.discount_value / Decimal("100")).quantize(Decimal("0.01"))
        return min(self.discount_value, subtotal_xaf)
