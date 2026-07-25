from celery import shared_task
from django.core.mail import mail_admins

from .selectors import list_low_stock_variants


@shared_task
def alert_low_stock(threshold: int = 5) -> int:
    variants = list(list_low_stock_variants(threshold))
    if variants:
        lines = [f"- {v.sku} ({v.product.name}): {v.available_quantity} restant(s)" for v in variants]
        mail_admins(
            subject="Alerte stock bas - The Imperial Edit",
            message="\n".join(lines),
            fail_silently=True,
        )
    return len(variants)
