from celery import shared_task
from django.core.mail import send_mail


@shared_task
def send_welcome_email(user_email: str) -> None:
    send_mail(
        subject="Bienvenue chez The Imperial Edit",
        message="Merci de votre inscription. Votre univers Impérial Collection vous attend.",
        from_email=None,
        recipient_list=[user_email],
        fail_silently=True,
    )


@shared_task
def send_password_reset_email(user_email: str, reset_url: str) -> None:
    send_mail(
        subject="Réinitialisation de votre mot de passe — The Imperial Edit",
        message=(
            "Vous avez demandé la réinitialisation de votre mot de passe.\n\n"
            f"Cliquez sur ce lien pour choisir un nouveau mot de passe : {reset_url}\n\n"
            "Ce lien expire dans 24 heures. Si vous n'êtes pas à l'origine de cette demande, "
            "vous pouvez ignorer cet e-mail sans risque : votre mot de passe actuel reste inchangé."
        ),
        from_email=None,
        recipient_list=[user_email],
        fail_silently=True,
    )
