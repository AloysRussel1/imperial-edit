from django.core.exceptions import ValidationError
from django.db import transaction

from .models import ProductVariant


@transaction.atomic
def reserve_stock(*, variant_id, quantity: int) -> ProductVariant:
    variant = ProductVariant.objects.select_for_update().get(id=variant_id)
    if variant.available_quantity < quantity:
        raise ValidationError(f"Stock insuffisant pour {variant.sku}: {variant.available_quantity} disponible(s).")
    variant.reserved_quantity += quantity
    variant.save(update_fields=["reserved_quantity", "updated_at"])
    return variant


@transaction.atomic
def release_stock(*, variant_id, quantity: int) -> ProductVariant:
    variant = ProductVariant.objects.select_for_update().get(id=variant_id)
    variant.reserved_quantity = max(variant.reserved_quantity - quantity, 0)
    variant.save(update_fields=["reserved_quantity", "updated_at"])
    return variant


@transaction.atomic
def commit_stock_deduction(*, variant_id, quantity: int) -> ProductVariant:
    variant = ProductVariant.objects.select_for_update().get(id=variant_id)
    variant.stock_quantity = max(variant.stock_quantity - quantity, 0)
    variant.reserved_quantity = max(variant.reserved_quantity - quantity, 0)
    variant.save(update_fields=["stock_quantity", "reserved_quantity", "updated_at"])
    return variant
