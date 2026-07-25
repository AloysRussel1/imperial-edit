import uuid

from django.core.exceptions import ValidationError
from django.db import transaction

from apps.orders.models import Order, OrderStatus

from .models import SourcingRequest, SourcingStatus


@transaction.atomic
def submit_sourcing_request(
    *,
    customer,
    reference_image=None,
    source_url: str = "",
    description: str = "",
    product_name: str = "",
    category: str = "other",
    size_or_shoe: str = "",
    budget_max_xaf=None,
) -> SourcingRequest:
    return SourcingRequest.objects.create(
        customer=customer,
        reference_image=reference_image,
        source_url=source_url,
        description=description,
        product_name=product_name,
        category=category,
        size_or_shoe=size_or_shoe,
        budget_max_xaf=budget_max_xaf,
    )


@transaction.atomic
def quote_sourcing_request(request_obj: SourcingRequest, *, quoted_price_xaf, admin_notes: str = "") -> SourcingRequest:
    request_obj.quoted_price_xaf = quoted_price_xaf
    request_obj.admin_notes = admin_notes
    request_obj.status = SourcingStatus.QUOTED
    request_obj.save(update_fields=["quoted_price_xaf", "admin_notes", "status", "updated_at"])
    return request_obj


@transaction.atomic
def reject_sourcing_request(request_obj: SourcingRequest, *, admin_notes: str = "") -> SourcingRequest:
    request_obj.admin_notes = admin_notes
    request_obj.status = SourcingStatus.REJECTED
    request_obj.save(update_fields=["admin_notes", "status", "updated_at"])
    return request_obj


@transaction.atomic
def convert_to_order(request_obj: SourcingRequest, *, deposit_percentage: int, shipping_address: str,
                      delivery_city: str) -> Order:
    if request_obj.status != SourcingStatus.QUOTED or not request_obj.quoted_price_xaf:
        raise ValidationError("La demande doit être devisée avant conversion en commande.")

    order = Order.objects.create(
        order_number=f"IE-SRC-{uuid.uuid4().hex[:8].upper()}",
        customer=request_obj.customer,
        status=OrderStatus.PENDING_DEPOSIT,
        subtotal_xaf=request_obj.quoted_price_xaf,
        total_xaf=request_obj.quoted_price_xaf,
        deposit_percentage=deposit_percentage,
        shipping_address=shipping_address,
        delivery_city=delivery_city,
        tracking_notes=f"Commande sur mesure issue de la demande de sourcing #{request_obj.id}",
    )
    request_obj.converted_order = order
    request_obj.status = SourcingStatus.CONVERTED
    request_obj.save(update_fields=["converted_order", "status", "updated_at"])
    return order
