from decimal import Decimal

from django.conf import settings
from django.core.exceptions import ValidationError
from django.db import transaction

from apps.orders.models import Order
from apps.orders.services import register_payment

from .gateways import get_gateway
from .models import Transaction, TransactionStatus

# Agrégateurs nécessitant des clés d'API réelles pour fonctionner, et le
# réglage qui indique qu'elles sont configurées. Tant qu'aucune clé n'est
# fournie, on bascule silencieusement sur le gateway "sandbox" pour que le
# tunnel d'achat reste opérationnel de bout en bout — le frontend n'a rien à
# changer le jour où de vraies clés sont ajoutées à l'environnement.
_REAL_PROVIDER_READY_CHECKS = {
    "cinetpay": lambda: bool(settings.CINETPAY_API_KEY and settings.CINETPAY_SITE_ID),
    "flutterwave": lambda: bool(settings.FLUTTERWAVE_SECRET_KEY),
}


def _resolve_provider(provider: str) -> str:
    is_ready = _REAL_PROVIDER_READY_CHECKS.get(provider)
    if is_ready is not None and not is_ready():
        return "sandbox"
    return provider


@transaction.atomic
def initiate_payment(
    *, order: Order, provider: str, purpose: str, payer_phone_number: str = "", payment_method: str = ""
) -> Transaction:
    if purpose == "deposit":
        amount = order.deposit_due_xaf - order.amount_paid_xaf
    else:
        amount = order.amount_remaining_xaf

    if amount <= 0:
        raise ValidationError("Aucun montant restant à payer pour ce motif.")

    if payment_method and payment_method != order.payment_method:
        order.payment_method = payment_method
        order.save(update_fields=["payment_method", "updated_at"])

    provider = _resolve_provider(provider)
    gateway = get_gateway(provider)
    result = gateway.initiate_payment(
        order=order, amount_xaf=amount, payer_phone_number=payer_phone_number, payment_method=payment_method
    )

    return Transaction.objects.create(
        order=order,
        provider=provider,
        purpose=purpose,
        amount_xaf=amount,
        provider_reference=result.reference,
        payer_phone_number=payer_phone_number,
        raw_payload={"payment_url": result.payment_url},
    )


@transaction.atomic
def process_webhook_event(*, provider: str, reference: str, provider_status: str, raw_payload: dict) -> Transaction:
    txn = Transaction.objects.select_for_update().get(provider_reference=reference, provider=provider)
    if txn.status != TransactionStatus.PENDING:
        return txn

    txn.raw_payload = raw_payload
    if provider_status.lower() in ("success", "successful", "completed"):
        txn.status = TransactionStatus.SUCCESS
        txn.save(update_fields=["status", "raw_payload", "updated_at"])
        register_payment(txn.order, Decimal(str(txn.amount_xaf)))
    else:
        txn.status = TransactionStatus.FAILED
        txn.save(update_fields=["status", "raw_payload", "updated_at"])
    return txn
