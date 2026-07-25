from rest_framework import viewsets

from apps.common.permissions import IsAdminRole

from .models import Coupon
from .serializers import CouponSerializer


class CouponViewSet(viewsets.ModelViewSet):
    queryset = Coupon.objects.all().order_by("-created_at")
    serializer_class = CouponSerializer
    permission_classes = (IsAdminRole,)
