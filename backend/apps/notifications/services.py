import logging

import requests
from django.conf import settings
from django.core.mail import EmailMultiAlternatives
from django.template.loader import render_to_string
from django.utils import timezone
from django.utils.html import strip_tags

from .models import NotificationChannel, NotificationLog, NotificationStatus

logger = logging.getLogger(__name__)


def _format_xaf(amount) -> str:
    return f"{float(amount):,.0f} XAF".replace(",", " ")


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


def send_template_email(
    *, to_email: str, subject: str, template_name: str, context: dict, order=None, sourcing_request=None
) -> bool:
    """
    Envoie un e-mail HTML (thème sombre & or) à partir du template
    `emails/<template_name>.html`, avec repli automatique en texte brut pour
    les clients mail qui ne rendent pas le HTML — journalisé comme WhatsApp.
    """
    if not to_email:
        _log(
            channel=NotificationChannel.EMAIL,
            recipient="",
            subject=subject,
            message="",
            status=NotificationStatus.SKIPPED,
            order=order,
            sourcing_request=sourcing_request,
        )
        return False

    html_body = render_to_string(f"emails/{template_name}.html", {**context, "year": timezone.now().year})
    text_body = strip_tags(html_body)

    try:
        email = EmailMultiAlternatives(subject=subject, body=text_body, to=[to_email])
        email.attach_alternative(html_body, "text/html")
        email.send(fail_silently=False)
    except Exception:
        logger.exception("Échec de l'envoi e-mail vers %s", to_email)
        _log(
            channel=NotificationChannel.EMAIL,
            recipient=to_email,
            subject=subject,
            message=text_body,
            status=NotificationStatus.FAILED,
            order=order,
            sourcing_request=sourcing_request,
        )
        return False

    _log(
        channel=NotificationChannel.EMAIL,
        recipient=to_email,
        subject=subject,
        message=text_body,
        status=NotificationStatus.SENT,
        order=order,
        sourcing_request=sourcing_request,
    )
    return True


def notify_order_deposit_paid(order) -> None:
    """Déclenché automatiquement dès qu'une commande passe à DEPOSIT_PAID."""
    first_name = order.customer.first_name or order.customer.email
    tracking_url = f"{settings.FRONTEND_URL}/tracking/{order.tracking_number or order.order_number}"

    whatsapp_message = (
        f"Bonjour {first_name}, votre acompte pour la commande {order.order_number} a bien été reçu "
        f"({_format_xaf(order.amount_paid_xaf)}). Solde restant dû à la livraison : "
        f"{_format_xaf(order.amount_remaining_xaf)}. Merci de votre confiance — Imperial Collection."
    )
    send_whatsapp_message(order.customer.whatsapp_number, whatsapp_message, order=order)

    send_template_email(
        to_email=order.customer.email,
        subject=f"Acompte reçu — commande {order.order_number}",
        template_name="deposit_confirmed",
        context={
            "first_name": first_name,
            "order_number": order.order_number,
            "tracking_number": order.tracking_number or order.order_number,
            "amount_paid": _format_xaf(order.amount_paid_xaf),
            "amount_remaining": _format_xaf(order.amount_remaining_xaf),
            "tracking_url": tracking_url,
        },
        order=order,
    )


# Habillage éditorial (titre + phrase d'accompagnement) par étape logistique —
# seules ces 4 étapes déclenchent un e-mail de mise à jour dédié : le dépôt de
# l'acompte a déjà son propre e-mail (`notify_order_deposit_paid`), et
# "en attente d'acompte"/"annulée" ne sont pas des jalons du parcours logistique.
_STATUS_UPDATE_COPY = {
    "sourcing_in_progress": (
        "Achat en cours en Europe",
        "votre pièce est en cours d'acquisition auprès de nos partenaires à Paris, Milan ou Londres.",
    ),
    "shipped_from_europe": (
        "Votre colis a quitté l'Europe",
        "votre colis a été expédié depuis l'Europe et est désormais en transit vers le Cameroun.",
    ),
    "arrived_in_cameroon": (
        "Colis disponible en agence",
        "votre colis est arrivé et vous attend en agence.",
    ),
    "delivered_and_completed": (
        "Commande livrée et soldée",
        "votre commande a été livrée et le solde a été réglé. Merci de votre confiance !",
    ),
}


def notify_order_status_update(order, status: str) -> None:
    """Déclenché à chaque avancement d'étape logistique (voir `record_status_change`)."""
    copy = _STATUS_UPDATE_COPY.get(status)
    if copy is None:
        return

    headline, body = copy
    first_name = order.customer.first_name or order.customer.email
    tracking_url = f"{settings.FRONTEND_URL}/tracking/{order.tracking_number or order.order_number}"
    remaining = order.amount_remaining_xaf

    whatsapp_parts = [f"Bonjour {first_name}, {body}"]
    if remaining > 0:
        whatsapp_parts.append(f"Solde restant à la livraison : {_format_xaf(remaining)}.")
    whatsapp_parts.append(f"Suivi en direct : {tracking_url}")
    send_whatsapp_message(order.customer.whatsapp_number, " ".join(whatsapp_parts), order=order)

    send_template_email(
        to_email=order.customer.email,
        subject=f"{headline} — commande {order.order_number}",
        template_name="status_update",
        context={
            "first_name": first_name,
            "headline": headline,
            "body": body,
            "order_number": order.order_number,
            "tracking_number": order.tracking_number or order.order_number,
            "carrier_note": order.carrier_notes,
            "amount_remaining": _format_xaf(remaining) if remaining > 0 else "",
            "tracking_url": tracking_url,
        },
        order=order,
    )


def notify_sourcing_quote_sent(sourcing_request) -> None:
    """Déclenché automatiquement lorsqu'un administrateur envoie un devis de sourcing."""
    first_name = sourcing_request.customer.first_name or sourcing_request.customer.email
    article = sourcing_request.product_name or "l'article recherché"
    quoted_price = _format_xaf(sourcing_request.quoted_price_xaf)

    whatsapp_message = (
        f"Bonjour {first_name}, nous avons trouvé « {article} » ! Prix proposé : {quoted_price}. "
        f"Connectez-vous à votre espace client pour valider la commande et régler l'acompte."
    )
    send_whatsapp_message(sourcing_request.customer.whatsapp_number, whatsapp_message, sourcing_request=sourcing_request)

    send_template_email(
        to_email=sourcing_request.customer.email,
        subject="Votre devis de sourcing est prêt",
        template_name="sourcing_quote",
        context={
            "first_name": first_name,
            "article": article,
            "quoted_price": quoted_price,
            "admin_notes": sourcing_request.admin_notes,
            "site_url": settings.FRONTEND_URL,
        },
        sourcing_request=sourcing_request,
    )
