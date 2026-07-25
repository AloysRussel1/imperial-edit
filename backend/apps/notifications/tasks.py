from celery import shared_task


@shared_task
def send_order_deposit_notification(order_id: str) -> None:
    from apps.orders.models import Order

    from .services import notify_order_deposit_paid

    order = Order.objects.select_related("customer").get(id=order_id)
    notify_order_deposit_paid(order)


@shared_task
def send_sourcing_quote_notification(sourcing_request_id: str) -> None:
    from apps.sourcing.models import SourcingRequest

    from .services import notify_sourcing_quote_sent

    sourcing_request = SourcingRequest.objects.select_related("customer").get(id=sourcing_request_id)
    notify_sourcing_quote_sent(sourcing_request)
