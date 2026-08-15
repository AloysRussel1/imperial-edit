import secrets
import string
import uuid
from datetime import timedelta
from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction
from django.utils import timezone

from apps.products.models import ProductVariant
from apps.products.services import release_stock, reserve_stock, sell_stock_immediately

from apps.notifications.tasks import send_order_deposit_notification, send_order_status_update_notification

from .models import Cart, Order, OrderItem, OrderStatus, OrderStatusHistory
from .tasks import notify_deposit_paid, send_order_receipt_email

# Le dépôt d'acompte a son propre e-mail dédié (`notify_order_deposit_paid`,
# déclenché depuis `register_payment`) ; "pending_deposit" et "cancelled" ne
# sont pas des jalons du parcours logistique — seules ces 4 étapes déclenchent
# l'e-mail générique de mise à jour de statut.
_STATUS_UPDATE_NOTIFY_STATUSES = frozenset(
    {
        OrderStatus.SOURCING_IN_PROGRESS,
        OrderStatus.SHIPPED_FROM_EUROPE,
        OrderStatus.ARRIVED_IN_CAMEROON,
        OrderStatus.DELIVERED_AND_COMPLETED,
    }
)

_TRACKING_CODE_ALPHABET = string.ascii_uppercase + string.digits


def _generate_order_number() -> str:
    return f"IE-{uuid.uuid4().hex[:8].upper()}"


def _generate_tracking_number() -> str:
    """Format `IC-<année>-<4 caractères>` (ex. `IC-2026-X89B`), unique en base."""
    year = timezone.now().year
    for _ in range(10):
        suffix = "".join(secrets.choice(_TRACKING_CODE_ALPHABET) for _ in range(4))
        candidate = f"IC-{year}-{suffix}"
        if not Order.objects.filter(tracking_number=candidate).exists():
            return candidate
    # Improbable après 10 tirages (36^4 combinaisons par année) — dernier recours déterministe.
    return f"IC-{year}-{uuid.uuid4().hex[:4].upper()}"


def record_status_change(order: Order, status: str, *, note: str = "", changed_by=None) -> Order:
    """Point de passage unique pour toute transition de statut : met à jour la
    commande ET journalise l'étape dans `OrderStatusHistory`, qui alimente la
    frise chronologique du client."""
    order.status = status
    if note:
        order.carrier_notes = note
    order.save(update_fields=["status", "carrier_notes", "updated_at"] if note else ["status", "updated_at"])
    OrderStatusHistory.objects.create(order=order, status=status, note=note, changed_by=changed_by)
    if status in _STATUS_UPDATE_NOTIFY_STATUSES:
        send_order_status_update_notification.delay(str(order.id), status)
    return order


@transaction.atomic
def create_order_from_cart(*, cart, deposit_percentage: int, shipping_address: str, delivery_city: str,
                            discount_xaf: Decimal = Decimal("0"), coupon_code: str = "") -> Order:
    if not cart.items.exists():
        raise ValidationError("Le panier est vide.")

    order = Order.objects.create(
        order_number=_generate_order_number(),
        tracking_number=_generate_tracking_number(),
        customer=cart.customer,
        deposit_percentage=deposit_percentage,
        shipping_address=shipping_address,
        delivery_city=delivery_city,
        discount_xaf=discount_xaf,
        coupon_code=coupon_code,
        reservation_expires_at=timezone.now()
        + timedelta(minutes=settings.STOCK_RESERVATION_TIMEOUT_MINUTES),
    )
    OrderStatusHistory.objects.create(order=order, status=OrderStatus.PENDING_DEPOSIT)

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
        tracking_number=_generate_tracking_number(),
        customer=customer,
        deposit_percentage=deposit_percentage,
        payment_method=payment_method,
        shipping_address=shipping_address,
        delivery_city=delivery_city,
        reservation_expires_at=timezone.now()
        + timedelta(minutes=settings.STOCK_RESERVATION_TIMEOUT_MINUTES),
    )
    OrderStatusHistory.objects.create(order=order, status=OrderStatus.PENDING_DEPOSIT)

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


def _resolve_pos_customer(*, cashier, email: str):
    """
    Client rattaché à une vente comptoir : si une adresse e-mail est saisie
    à l'encaissement, on retrouve ou crée un compte CLIENT (mot de passe
    inutilisable — ce n'est pas une inscription, juste un point de contact
    pour le reçu ; le client pourra le réinitialiser plus tard s'il veut
    vraiment se créer un compte en ligne). Sans e-mail (client de passage
    anonyme), la commande est rattachée à la/au caissier·e elle/lui-même —
    `Order.customer` est une FK obligatoire, jamais nulle.
    """
    from apps.users.models import User, UserRole

    email = (email or "").strip().lower()
    if not email:
        return cashier

    user = User.objects.filter(email__iexact=email).first()
    if user is not None:
        return user

    user = User(email=email, username=email, first_name="", last_name="", role=UserRole.CUSTOMER, is_active=True)
    user.set_unusable_password()
    user.save()
    return user


@transaction.atomic
def create_pos_order(*, cashier, items: list[dict], payment_method: str, customer_email: str = "") -> Order:
    """
    Vente comptoir (POS, boutique de Yaoundé) : à la différence du tunnel en
    ligne (acompte puis solde à la livraison, stock simplement réservé),
    l'encaissement est intégral et immédiat — l'article quitte le magasin
    sur-le-champ. Le stock est donc décompté directement
    (sell_stock_immediately, pas reserve_stock) et la commande est réglée en
    un seul geste via register_payment(order.total_xaf), qui la fait passer
    directement à "Livré & soldé" et déclenche le reçu par e-mail le cas
    échéant (voir register_payment).
    """
    if not items:
        raise ValidationError("Le ticket est vide.")

    customer = _resolve_pos_customer(cashier=cashier, email=customer_email)
    # Si ce client a un panier en ligne resté ouvert, on le vide : sans ça, il
    # retrouverait à sa prochaine visite du site des articles déjà achetés en
    # boutique — l'achat comptoir doit se comporter, côté panier, exactement
    # comme une commande en ligne finalisée (voir create_order_from_cart).
    Cart.objects.filter(customer=customer, is_active=True).update(is_active=False)

    order = Order.objects.create(
        order_number=_generate_order_number(),
        tracking_number=_generate_tracking_number(),
        customer=customer,
        deposit_percentage=100,
        payment_method=payment_method,
        shipping_address="Vente comptoir — boutique Yaoundé",
        delivery_city="Yaoundé",
    )
    OrderStatusHistory.objects.create(order=order, status=OrderStatus.PENDING_DEPOSIT)

    subtotal = Decimal("0")
    for entry in items:
        try:
            variant = ProductVariant.objects.select_related("product").get(id=entry["variant_id"])
        except ProductVariant.DoesNotExist as exc:
            raise ValidationError(f"Variante introuvable : {entry['variant_id']}") from exc
        quantity = int(entry["quantity"])
        sell_stock_immediately(variant_id=variant.id, quantity=quantity)
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

    register_payment(order, order.total_xaf)
    return order


@transaction.atomic
def cancel_order(order: Order) -> Order:
    for item in order.items.select_related("variant"):
        release_stock(variant_id=item.variant_id, quantity=item.quantity)
    return record_status_change(order, OrderStatus.CANCELLED)


def _has_emailable_customer(order: Order) -> bool:
    """
    Un reçu ne part que vers une VRAIE adresse cliente — jamais vers la/le
    caissier·e à qui une vente comptoir sans e-mail saisi est rattachée par
    défaut (voir _resolve_pos_customer) : `role == "customer"` distingue
    proprement les deux sans nécessiter de champ supplémentaire en base.
    """
    return bool(order.customer.email) and order.customer.role == "customer"


@transaction.atomic
def register_payment(order: Order, amount_xaf: Decimal) -> Order:
    was_pending = order.status == OrderStatus.PENDING_DEPOSIT
    previous_status = order.status
    order.amount_paid_xaf += amount_xaf

    if order.status == OrderStatus.PENDING_DEPOSIT and order.amount_paid_xaf >= order.deposit_due_xaf:
        order.status = OrderStatus.DEPOSIT_PAID
    # Le solde restant est réglé à la livraison (cf. `settle_balance`) : un paiement
    # qui couvre le total finalise donc directement la commande.
    if order.amount_paid_xaf >= order.total_xaf and order.status != OrderStatus.CANCELLED:
        order.status = OrderStatus.DELIVERED_AND_COMPLETED

    order.save(update_fields=["amount_paid_xaf", "status", "updated_at"])
    if order.status != previous_status:
        OrderStatusHistory.objects.create(order=order, status=order.status)

    if was_pending and order.status in (OrderStatus.DEPOSIT_PAID, OrderStatus.DELIVERED_AND_COMPLETED):
        notify_deposit_paid.delay(str(order.id))  # notification interne (mail_admins), utile même pour une vente comptoir
        # Confirmation client (WhatsApp + e-mail) : jamais envoyée quand `order.customer`
        # est en fait la/le caissier·e (repli sans e-mail saisi, voir
        # _resolve_pos_customer) — le message parle d'« acompte » et de « solde à la
        # livraison », qui n'ont aucun sens pour une vente comptoir déjà soldée, et
        # ce serait de toute façon lui envoyer une fausse confirmation d'achat à
        # elle-même plutôt qu'à un client.
        if _has_emailable_customer(order):
            send_order_deposit_notification.delay(str(order.id))

    # Reçu détaillé (Brevo) dès que la commande devient intégralement soldée,
    # que ce soit en un seul geste (vente comptoir) ou au règlement du solde
    # en ligne à la livraison — point de passage unique, donc couvre les deux
    # flux sans dupliquer la logique de déclenchement.
    if (
        previous_status != OrderStatus.DELIVERED_AND_COMPLETED
        and order.status == OrderStatus.DELIVERED_AND_COMPLETED
        and _has_emailable_customer(order)
    ):
        send_order_receipt_email.delay(str(order.id))

    return order


@transaction.atomic
def advance_logistics_status(order: Order, new_status: str, *, note: str = "", changed_by=None) -> Order:
    """Action rapide back-office : fait avancer la commande à l'étape logistique
    choisie et journalise, en option, une note visible sur la frise du client."""
    return record_status_change(order, new_status, note=note, changed_by=changed_by)
