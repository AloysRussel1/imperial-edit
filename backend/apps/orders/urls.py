from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AdminDashboardSummaryView, OrderTrackingView, OrderViewSet

app_name = "orders"

router = DefaultRouter()
router.register("", OrderViewSet, basename="order")

urlpatterns = [
    path("admin-summary/", AdminDashboardSummaryView.as_view(), name="admin-summary"),
    path("<str:lookup>/tracking/", OrderTrackingView.as_view(), name="tracking"),
    *router.urls,
]
