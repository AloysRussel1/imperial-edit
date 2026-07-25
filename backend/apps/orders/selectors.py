from django.utils import timezone

from .models import Order, OrderStatus


def get_active_cart_for_customer(customer):
    return customer.carts.filter(is_active=True).prefetch_related("items__variant").first()


def list_orders_for_customer(customer):
    return Order.objects.filter(customer=customer).prefetch_related("items").order_by("-created_at")


def list_expired_unpaid_orders():
    return Order.objects.filter(
        status=OrderStatus.PENDING_DEPOSIT,
        reservation_expires_at__lte=timezone.now(),
    )


def dashboard_financial_summary():
    orders = Order.objects.exclude(status=OrderStatus.CANCELLED)
    total_revenue = sum((o.total_xaf for o in orders), start=0)
    total_collected = sum((o.amount_paid_xaf for o in orders), start=0)
    total_outstanding = sum((o.amount_remaining_xaf for o in orders), start=0)
    return {
        "total_revenue_xaf": total_revenue,
        "total_collected_xaf": total_collected,
        "total_outstanding_xaf": total_outstanding,
    }
