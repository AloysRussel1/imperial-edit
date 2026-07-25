from decimal import Decimal

from django.core.exceptions import ValidationError
from django.db import transaction
from django.db.models import F

from .selectors import get_valid_coupon


def apply_coupon(*, code: str, cart) -> Decimal:
    coupon = get_valid_coupon(code)
    if coupon is None:
        raise ValidationError("Code promo invalide ou expiré.")
    if coupon.max_uses is not None and coupon.times_used >= coupon.max_uses:
        raise ValidationError("Ce code promo a atteint sa limite d'utilisation.")

    subtotal = sum(
        (item.variant.price_xaf * item.quantity for item in cart.items.select_related("variant")),
        start=Decimal("0"),
    )
    if subtotal < coupon.minimum_amount_xaf:
        raise ValidationError(f"Montant minimum d'achat requis: {coupon.minimum_amount_xaf} XAF.")

    with transaction.atomic():
        coupon.__class__.objects.filter(id=coupon.id).update(times_used=F("times_used") + 1)

    return coupon.compute_discount(subtotal)
