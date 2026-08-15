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


def _format_xaf(amount) -> str:
    return f"{float(amount):,.0f} XAF".replace(",", " ")


@shared_task
def send_order_receipt_email(order_id: str) -> None:
    """Reçu détaillé (Brevo, pas le relais SMTP générique) déclenché depuis
    register_payment() dès qu'une commande devient intégralement soldée —
    vente comptoir ou solde en ligne réglé à la livraison."""
    from django.template.loader import render_to_string
    from django.utils import timezone

    from apps.notifications.services import send_brevo_email

    from .models import Order

    order = Order.objects.select_related("customer").prefetch_related("items").get(id=order_id)
    first_name = order.customer.first_name or order.customer.email

    html_content = render_to_string(
        "emails/order_receipt.html",
        {
            "first_name": first_name,
            "order_number": order.order_number,
            "is_pos": order.shipping_address == "Vente comptoir — boutique Yaoundé",
            "items": [
                {
                    "name": item.product_name_snapshot,
                    "sku": item.sku_snapshot,
                    "quantity": item.quantity,
                    "line_total": _format_xaf(item.line_total_xaf),
                }
                for item in order.items.all()
            ],
            "total": _format_xaf(order.total_xaf),
            "payment_method": order.get_payment_method_display() or "—",
            "year": timezone.now().year,
        },
    )
    send_brevo_email(
        to_email=order.customer.email,
        to_name=first_name,
        subject=f"Votre reçu — commande {order.order_number}",
        html_content=html_content,
    )
