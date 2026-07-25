from django.db import models

from apps.common.models import BaseModel
from apps.orders.models import Order


class PaymentProvider(models.TextChoices):
    CINETPAY = "cinetpay", "CinetPay"
    FLUTTERWAVE = "flutterwave", "Flutterwave"
    CASH_ON_DELIVERY = "cash_on_delivery", "Espèces à la livraison"
    MOMO_ON_DELIVERY = "momo_on_delivery", "Mobile Money à la livraison"
    SANDBOX = "sandbox", "Bac à sable (démo, sans clés API réelles)"


class PaymentPurpose(models.TextChoices):
    DEPOSIT = "deposit", "Acompte"
    BALANCE = "balance", "Solde restant"
    FULL = "full", "Paiement intégral"


class TransactionStatus(models.TextChoices):
    PENDING = "pending", "En attente"
    SUCCESS = "success", "Réussi"
    FAILED = "failed", "Échoué"


class Transaction(BaseModel):
    order = models.ForeignKey(Order, on_delete=models.PROTECT, related_name="transactions")
    provider = models.CharField(max_length=30, choices=PaymentProvider.choices)
    purpose = models.CharField(max_length=20, choices=PaymentPurpose.choices)
    status = models.CharField(max_length=20, choices=TransactionStatus.choices, default=TransactionStatus.PENDING)
    amount_xaf = models.DecimalField(max_digits=12, decimal_places=2)
    provider_reference = models.CharField(max_length=120, unique=True)
    payer_phone_number = models.CharField(max_length=20, blank=True)
    raw_payload = models.JSONField(default=dict, blank=True)

    class Meta:
        db_table = "transactions"
        indexes = [models.Index(fields=["provider_reference"]), models.Index(fields=["status"])]

    def __str__(self) -> str:
        return f"{self.provider_reference} ({self.status})"
