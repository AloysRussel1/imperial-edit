import uuid
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.products.models import ProductVariant
from apps.products.services import release_stock, reserve_stock

from .models import Order, OrderItem, OrderStatus
from .tasks import notify_deposit_paid


def _generate_order_number() -> str:
    return f"IE-{uuid.uuid4().hex[:8].upper()}"


@transaction.atomic
def create_order_from_cart(*, cart, deposit_percentage: int, shipping_address: str, delivery_city: str,
                            discount_xaf: Decimal = Decimal("0"), coupon_code: str = "") -> Order:
    if not cart.items.exists():
        raise ValidationError("Le panier est vide.")

    order = Order.objects.create(
        order_number=_generate_order_number(),
        customer=cart.customer,
        deposit_percentage=deposit_percentage,
        shipping_address=shipping_address,
        delivery_city=delivery_city,
        discount_xaf=discount_xaf,
        coupon_code=coupon_code,
        reservation_expires_at=timezone.now()
        + timedelta(minutes=settings.STOCK_RESERVATION_TIMEOUT_MINUTES),
    )

    subtotal = Decimal("0")
    for cart_item in cart.items.select_related("variant__product"):
        reserve_stock(variant_id=cart_item.variant_id, quantity=cart_item.quantity)
        unit_price = cart_item.variant.price_xaf
        OrderItem.objects.create(
            order=order,
            variant=cart_item.variant,
            product_name_snapshot=cart_item.variant.product.name,
            sku_snapshot=cart_item.variant.sku,
            unit_price_xaf=unit_price,
            quantity=cart_item.quantity,
        )
        subtotal += unit_price * cart_item.quantity

    order.subtotal_xaf = subtotal
    order.total_xaf = max(subtotal - discount_xaf, Decimal("0"))
    order.save(update_fields=["subtotal_xaf", "total_xaf"])

    cart.is_active = False
    cart.save(update_fields=["is_active"])
    return order


@transaction.atomic
def create_order_from_items(*, customer, items: list[dict], deposit_percentage: int, shipping_address: str,
                             delivery_city: str, payment_method: str = "") -> Order:
    """
    Crée une commande directement à partir d'une liste d'articles
    (`[{"variant_id": ..., "quantity": ...}, ...]`), sans passer par un panier
    persistant côté serveur — le panier de cette boutique vit côté client
    (Next.js) ; seule la validation finale (checkout) touche le backend.
    Les prix sont toujours recalculés à partir des variantes en base, jamais
    depuis des montants fournis par le client.
    """
    if not items:
        raise ValidationError("Aucun article à commander.")

    order = Order.objects.create(
        order_number=_generate_order_number(),
        customer=customer,
        deposit_percentage=deposit_percentage,
        payment_method=payment_method,
        shipping_address=shipping_address,
        delivery_city=delivery_city,
        reservation_expires_at=timezone.now()
        + timedelta(minutes=settings.STOCK_RESERVATION_TIMEOUT_MINUTES),
    )

    subtotal = Decimal("0")
    for entry in items:
        try:
            variant = ProductVariant.objects.select_related("product").get(id=entry["variant_id"])
        except ProductVariant.DoesNotExist as exc:
            raise ValidationError(f"Variante introuvable : {entry['variant_id']}") from exc
        quantity = int(entry["quantity"])
        reserve_stock(variant_id=variant.id, quantity=quantity)
        unit_price = variant.price_xaf
        OrderItem.objects.create(
            order=order,
            variant=variant,
            product_name_snapshot=variant.product.name,
            sku_snapshot=variant.sku,
            unit_price_xaf=unit_price,
            quantity=quantity,
        )
        subtotal += unit_price * quantity

    order.subtotal_xaf = subtotal
    order.total_xaf = subtotal
    order.save(update_fields=["subtotal_xaf", "total_xaf"])
    return order


@transaction.atomic
def cancel_order(order: Order) -> Order:
    for item in order.items.select_related("variant"):
        release_stock(variant_id=item.variant_id, quantity=item.quantity)
    order.status = OrderStatus.CANCELLED
    order.save(update_fields=["status", "updated_at"])
    return order


@transaction.atomic
def register_payment(order: Order, amount_xaf: Decimal) -> Order:
    was_pending = order.status == OrderStatus.PENDING_DEPOSIT
    order.amount_paid_xaf += amount_xaf
    if order.status == OrderStatus.PENDING_DEPOSIT and order.amount_paid_xaf >= order.deposit_due_xaf:
        order.status = OrderStatus.DEPOSIT_PAID
    if order.amount_paid_xaf >= order.total_xaf and order.status != OrderStatus.CANCELLED:
        order.status = OrderStatus.COMPLETED
    order.save(update_fields=["amount_paid_xaf", "status", "updated_at"])
    if was_pending and order.status in (OrderStatus.DEPOSIT_PAID, OrderStatus.COMPLETED):
        notify_deposit_paid.delay(str(order.id))
    return order


@transaction.atomic
def advance_logistics_status(order: Order, new_status: str) -> Order:
    order.status = new_status
    order.save(update_fields=["status", "updated_at"])
    return order
