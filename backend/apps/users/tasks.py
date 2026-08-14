from celery import shared_task
from django.conf import settings


@shared_task
def send_welcome_email(user_email: str, first_name: str = "") -> None:
    from apps.notifications.services import send_template_email

    send_template_email(
        to_email=user_email,
        subject="Bienvenue chez Imperial Collection",
        template_name="welcome",
        context={"first_name": first_name or user_email, "site_url": settings.FRONTEND_URL},
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
