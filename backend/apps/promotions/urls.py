from rest_framework.routers import DefaultRouter

from .views import CouponViewSet

app_name = "promotions"

router = DefaultRouter()
router.register("coupons", CouponViewSet, basename="coupon")

urlpatterns = router.urls
