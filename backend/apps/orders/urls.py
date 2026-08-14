from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AdminDashboardSummaryView, OrderTrackingView, OrderViewSet, VendorOrderItemViewSet

app_name = "orders"

router = DefaultRouter()
router.register("", OrderViewSet, basename="order")

urlpatterns = [
    path("admin-summary/", AdminDashboardSummaryView.as_view(), name="admin-summary"),
    path("<str:lookup>/tracking/", OrderTrackingView.as_view(), name="tracking"),
    *router.urls,
]

# Lignes de commande à préparer, côté vendeur : monté à part sous
# /api/vendor/order-items/ — voir core/urls.py.
vendor_router = DefaultRouter()
vendor_router.register("", VendorOrderItemViewSet, basename="vendor-order-item")
vendor_urlpatterns = vendor_router.urls
