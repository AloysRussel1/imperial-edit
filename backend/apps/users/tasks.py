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
