from celery import shared_task
from django.core.mail import mail_admins


@shared_task
def release_expired_reservations() -> int:
    from .selectors import list_expired_unpaid_orders
    from .services import cancel_order

    expired_orders = list(list_expired_unpaid_orders())
    for order in expired_orders:
        cancel_order(order)
    return len(expired_orders)


@shared_task
def notify_deposit_paid(order_id: str) -> None:
    from .models import Order

    order = Order.objects.select_related("customer").get(id=order_id)
    mail_admins(
        subject=f"Acompte reçu — commande {order.order_number}",
        message=(
            f"L'acompte de la commande {order.order_number} a été réglé "
            f"({order.amount_paid_xaf} {order.currency} sur {order.total_xaf} {order.currency}).\n"
            f"Client : {order.customer.email}\nLivraison : {order.delivery_city}"
        ),
        fail_silently=True,
    )
