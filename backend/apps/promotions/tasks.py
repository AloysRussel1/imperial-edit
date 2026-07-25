from celery import shared_task
from django.utils import timezone

from .models import Coupon


@shared_task
def deactivate_expired_coupons() -> int:
    return Coupon.objects.filter(is_active=True, valid_until__lt=timezone.now()).update(is_active=False)
