import logging

import requests
from django.conf import settings
from django.core.mail import send_mail

from .models import NotificationChannel, NotificationLog, NotificationStatus

logger = logging.getLogger(__name__)


def _log(*, channel, recipient, message, status, subject="", order=None, sourcing_request=None):
    NotificationLog.objects.create(
        channel=channel,
        recipient=recipient,
        subject=subject,
        message=message,
        status=status,
        related_order=order,
        related_sourcing_request=sourcing_request,
    )


def send_whatsapp_message(to_number: str, message: str, *, order=None, sourcing_request=None) -> bool:
    """
    Envoie un message WhatsApp via l'API Cloud de Meta (format standard,
    compatible avec la plupart des numéros WhatsApp Business en Afrique).

    Tant que WHATSAPP_ACCESS_TOKEN / WHATSAPP_PHONE_NUMBER_ID ne sont pas
    configurés (pas de compte WhatsApp Business réel), l'envoi est simplement
    journalisé (log + NotificationLog) sans appel réseau — même logique de
    repli « sandbox » que la passerelle CinetPay.
    """
    if not to_number:
        logger.info("[WhatsApp] destinataire manquant, notification ignorée.")
        _log(
            channel=NotificationChannel.WHATSAPP,
            recipient="",
            message=message,
            status=NotificationStatus.SKIPPED,
            order=order,
            sourcing_request=sourcing_request,
        )
        return False

    if not (settings.WHATSAPP_ACCESS_TOKEN and settings.WHATSAPP_PHONE_NUMBER_ID):
        logger.info("[WhatsApp - sandbox, API non configurée] -> %s: %s", to_number, message)
        _log(
            channel=NotificationChannel.WHATSAPP,
            recipient=to_number,
            message=message,
            status=NotificationStatus.SKIPPED,
            order=order,
            sourcing_request=sourcing_request,
        )
        return False

    url = f"{settings.WHATSAPP_API_URL}/{settings.WHATSAPP_PHONE_NUMBER_ID}/messages"
    try:
        response = requests.post(
            url,
            headers={"Authorization": f"Bearer {settings.WHATSAPP_ACCESS_TOKEN}"},
            json={
                "messaging_product": "whatsapp",
                "to": to_number.lstrip("+"),
                "type": "text",
                "text": {"body": message},
            },
            timeout=15,
        )
        response.raise_for_status()
    except requests.RequestException:
        logger.exception("Échec de l'envoi WhatsApp vers %s", to_number)
        _log(
            channel=NotificationChannel.WHATSAPP,
            recipient=to_number,
            message=message,
            status=NotificationStatus.FAILED,
            order=order,
            sourcing_request=sourcing_request,
        )
        return False

    _log(
        channel=NotificationChannel.WHATSAPP,
        recipient=to_number,
        message=message,
        status=NotificationStatus.SENT,
        order=order,
        sourcing_request=sourcing_request,
    )
    return True


def send_transactional_email(*, to_email: str, subject: str, message: str, order=None, sourcing_request=None) -> bool:
    if not to_email:
        _log(
            channel=NotificationChannel.EMAIL,
            recipient="",
            subject=subject,
            message=message,
            status=NotificationStatus.SKIPPED,
            order=order,
            sourcing_request=sourcing_request,
        )
        return False

    try:
        send_mail(subject=subject, message=message, from_email=None, recipient_list=[to_email], fail_silently=False)
    except Exception:
        logger.exception("Échec de l'envoi e-mail vers %s", to_email)
        _log(
            channel=NotificationChannel.EMAIL,
            recipient=to_email,
            subject=subject,
            message=message,
            status=NotificationStatus.FAILED,
            order=order,
            sourcing_request=sourcing_request,
        )
        return False

    _log(
        channel=NotificationChannel.EMAIL,
        recipient=to_email,
        subject=subject,
        message=message,
        status=NotificationStatus.SENT,
        order=order,
        sourcing_request=sourcing_request,
    )
    return True


def notify_order_deposit_paid(order) -> None:
    """Déclenché automatiquement dès qu'une commande passe à DEPOSIT_PAID."""
    first_name = order.customer.first_name or order.customer.email

    whatsapp_message = (
        f"Bonjour {first_name}, votre acompte pour la commande {order.order_number} a bien été reçu "
        f"({order.amount_paid_xaf} {order.currency}). Solde restant dû à la livraison : "
        f"{order.amount_remaining_xaf} {order.currency}. Merci de votre confiance — The Imperial Collection."
    )
    send_whatsapp_message(order.customer.whatsapp_number, whatsapp_message, order=order)

    email_message = (
        f"Bonjour {first_name},\n\n"
        f"Nous avons bien reçu votre acompte pour la commande {order.order_number}.\n\n"
        f"Montant réglé : {order.amount_paid_xaf} {order.currency}\n"
        f"Solde restant dû à la livraison : {order.amount_remaining_xaf} {order.currency}\n"
        f"Ville de livraison : {order.delivery_city}\n\n"
        f"Merci de votre confiance,\nL'équipe The Imperial Collection"
    )
    send_transactional_email(
        to_email=order.customer.email,
        subject=f"Acompte reçu — commande {order.order_number}",
        message=email_message,
        order=order,
    )


def notify_sourcing_quote_sent(sourcing_request) -> None:
    """Déclenché automatiquement lorsqu'un administrateur envoie un devis de sourcing."""
    first_name = sourcing_request.customer.first_name or sourcing_request.customer.email
    article = sourcing_request.product_name or "l'article recherché"

    whatsapp_message = (
        f"Bonjour {first_name}, nous avons trouvé « {article} » ! Prix proposé : "
        f"{sourcing_request.quoted_price_xaf} XAF. Connectez-vous à votre espace client pour valider "
        f"la commande et régler l'acompte."
    )
    send_whatsapp_message(sourcing_request.customer.whatsapp_number, whatsapp_message, sourcing_request=sourcing_request)

    notes = f"\nNotes : {sourcing_request.admin_notes}" if sourcing_request.admin_notes else ""
    email_message = (
        f"Bonjour {first_name},\n\n"
        f"Bonne nouvelle : nous avons localisé « {article} ».\n\n"
        f"Prix proposé : {sourcing_request.quoted_price_xaf} XAF{notes}\n\n"
        f"Connectez-vous à votre espace client pour valider la commande et régler l'acompte.\n\n"
        f"L'équipe The Imperial Collection"
    )
    send_transactional_email(
        to_email=sourcing_request.customer.email,
        subject="Votre devis de sourcing est prêt",
        message=email_message,
        sourcing_request=sourcing_request,
    )
