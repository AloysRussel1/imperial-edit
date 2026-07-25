from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import AdminDashboardSummaryView, OrderViewSet

app_name = "orders"

router = DefaultRouter()
router.register("", OrderViewSet, basename="order")

urlpatterns = [
    path("admin-summary/", AdminDashboardSummaryView.as_view(), name="admin-summary"),
    *router.urls,
]
