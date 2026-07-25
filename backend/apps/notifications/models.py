from django.db import models

from apps.common.models import BaseModel


class NotificationChannel(models.TextChoices):
    WHATSAPP = "whatsapp", "WhatsApp"
    EMAIL = "email", "E-mail"


class NotificationStatus(models.TextChoices):
    SENT = "sent", "Envoyée"
    FAILED = "failed", "Échec"
    SKIPPED = "skipped", "Ignorée (destinataire ou clé API manquants)"


class NotificationLog(BaseModel):
    """
    Trace de chaque tentative d'envoi (WhatsApp / e-mail), y compris celles
    ignorées faute de configuration — utile pour vérifier depuis l'admin que
    le déclenchement automatique a bien eu lieu, même en environnement de
    développement sans clé API WhatsApp réelle.
    """

    channel = models.CharField(max_length=20, choices=NotificationChannel.choices)
    recipient = models.CharField(max_length=120, blank=True)
    subject = models.CharField(max_length=200, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=NotificationStatus.choices)
    related_order = models.ForeignKey(
        "orders.Order", null=True, blank=True, on_delete=models.SET_NULL, related_name="notifications"
    )
    related_sourcing_request = models.ForeignKey(
        "sourcing.SourcingRequest",
        null=True,
        blank=True,
        on_delete=models.SET_NULL,
        related_name="notifications",
    )

    class Meta:
        db_table = "notification_logs"
        ordering = ["-created_at"]
        indexes = [models.Index(fields=["channel", "status"])]

    def __str__(self) -> str:
        return f"{self.get_channel_display()} → {self.recipient or '(sans destinataire)'} [{self.status}]"
