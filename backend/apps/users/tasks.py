import logging

from celery import shared_task
from django.conf import settings

logger = logging.getLogger(__name__)


@shared_task
def send_welcome_email(user_email: str, first_name: str = "") -> None:
    # Route via l'API HTTP Brevo (send_brevo_email), pas le backend SMTP natif
    # de Django (send_template_email) : c'est cet appel SMTP, co-déclenché à
    # chaque inscription juste avant l'émission du code OTP, qui provoquait
    # les erreurs "SMTPServerDisconnected: please run connect() first" — tout
    # le flux d'inscription passe désormais exclusivement par Brevo.
    from django.template.loader import render_to_string
    from django.utils import timezone

    from apps.notifications.services import send_brevo_email

    html_content = render_to_string(
        "emails/welcome.html",
        {"first_name": first_name or user_email, "site_url": settings.FRONTEND_URL, "year": timezone.now().year},
    )
    send_brevo_email(
        to_email=user_email,
        to_name=first_name or user_email,
        subject="Bienvenue chez Imperial Collection",
        html_content=html_content,
    )


@shared_task
def send_password_reset_email(user_email: str, reset_url: str) -> None:
    from apps.notifications.services import send_template_email

    send_template_email(
        to_email=user_email,
        subject="Réinitialisation de votre mot de passe — Imperial Collection",
        template_name="password_reset",
        context={"reset_url": reset_url},
    )


@shared_task
def send_otp_email(user_email: str, first_name: str, code: str) -> None:
    from django.template.loader import render_to_string
    from django.utils import timezone

    from apps.notifications.services import send_brevo_email
    from apps.users.models import EmailVerificationOTP

    if not settings.BREVO_API_KEY:
        # Repli local/dev explicite, sans appel réseau (send_brevo_email fait
        # le même constat et journalise de son côté, mais sans le code en
        # clair) : le seul moyen de tester le flux OTP de bout en bout tant
        # qu'aucune clé Brevo réelle n'est configurée.
        logger.info("[OTP LOG] Code OTP pour %s: %s", user_email, code)

    html_content = render_to_string(
        "emails/otp_verification.html",
        {
            "first_name": first_name or user_email,
            "code": code,
            "validity_minutes": EmailVerificationOTP.VALIDITY_MINUTES,
            "year": timezone.now().year,
        },
    )
    send_brevo_email(
        to_email=user_email,
        to_name=first_name or user_email,
        subject="Votre code de vérification — Imperial Collection",
        html_content=html_content,
    )
