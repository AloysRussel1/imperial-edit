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
    # Trois chemins vers la même vue : celui effectivement enregistré comme
    # URL de notification dans le tableau de bord CinetPay (cinetpay-notify),
    # celui documenté dans .env.example/CINETPAY_NOTIFY_URL
    # (cinetpay/notify), et l'alias historique (webhooks/cinetpay) — retirer
    # l'un d'eux casserait silencieusement les notifications si l'URL exacte
    # configurée côté CinetPay diffère de celle qu'on croit utiliser ici.
    path("cinetpay-notify/", CinetPayWebhookView.as_view(), name="cinetpay-notify"),
    path("cinetpay/notify/", CinetPayWebhookView.as_view(), name="cinetpay-notify-alt"),
    path("webhooks/cinetpay/", CinetPayWebhookView.as_view(), name="webhook-cinetpay"),
    path("webhooks/flutterwave/", FlutterwaveWebhookView.as_view(), name="webhook-flutterwave"),
    *router.urls,
]
