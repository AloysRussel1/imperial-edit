from django.utils import timezone

from .models import Coupon


def get_valid_coupon(code: str) -> Coupon | None:
    now = timezone.now()
    return Coupon.objects.filter(
        code__iexact=code, is_active=True, valid_from__lte=now, valid_until__gte=now
    ).first()
