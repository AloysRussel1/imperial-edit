from celery import shared_task
from django.core.mail import mail_admins


@shared_task
def notify_admin_new_sourcing_request(request_id) -> None:
    mail_admins(
        subject="Nouvelle demande de sourcing sur photo",
        message=f"Une nouvelle demande de sourcing (#{request_id}) attend une étude et un devis.",
        fail_silently=True,
    )
