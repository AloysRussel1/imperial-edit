from datetime import timedelta
from decimal import Decimal

import pytest
from django.utils import timezone

from apps.promotions.models import Coupon, DiscountType


@pytest.mark.django_db
def test_percentage_coupon_computes_discount():
    coupon = Coupon.objects.create(
        code="IMPERIAL10",
        discount_type=DiscountType.PERCENTAGE,
        discount_value=Decimal("10"),
        valid_from=timezone.now() - timedelta(days=1),
        valid_until=timezone.now() + timedelta(days=1),
    )
    assert coupon.compute_discount(Decimal("100000")) == Decimal("10000.00")
