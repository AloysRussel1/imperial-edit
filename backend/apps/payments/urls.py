from django.urls import path
from rest_framework.routers import DefaultRouter

from .views import (
    CinetPayWebhookView,
    FlutterwaveWebhookView,
    InitiatePaymentView,
    PaymentWebhookView,
    TransactionViewSet,
)

app_name = "payments"

router = DefaultRouter()
router.register("transactions", TransactionViewSet, basename="transaction")

urlpatterns = [
    path("initiate/", InitiatePaymentView.as_view(), name="initiate"),
    path("webhook/", PaymentWebhookView.as_view(), name="webhook"),
    # Alias explicite demandé pour la notification CinetPay (même vue).
    path("cinetpay-notify/", CinetPayWebhookView.as_view(), name="cinetpay-notify"),
    path("webhooks/cinetpay/", CinetPayWebhookView.as_view(), name="webhook-cinetpay"),
    path("webhooks/flutterwave/", FlutterwaveWebhookView.as_view(), name="webhook-flutterwave"),
    *router.urls,
]
