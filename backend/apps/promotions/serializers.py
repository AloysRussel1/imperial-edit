from rest_framework import serializers

from .models import Coupon


class CouponSerializer(serializers.ModelSerializer):
    class Meta:
        model = Coupon
        fields = (
            "id",
            "code",
            "discount_type",
            "discount_value",
            "minimum_amount_xaf",
            "max_uses",
            "times_used",
            "valid_from",
            "valid_until",
            "is_active",
        )
        read_only_fields = ("times_used",)
