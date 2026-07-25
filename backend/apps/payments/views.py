from django.core.exceptions import ValidationError
from django.shortcuts import get_object_or_404
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from rest_framework import status, viewsets
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdminRole
from apps.orders.models import Order

from .gateways import get_gateway
from .models import Transaction
from .serializers import InitiatePaymentSerializer, TransactionSerializer, WebhookEventSerializer
from .services import initiate_payment
from .tasks import handle_payment_webhook


class TransactionViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = Transaction.objects.all().order_by("-created_at")
    serializer_class = TransactionSerializer
    permission_classes = (IsAdminRole,)


class InitiatePaymentView(APIView):
    permission_classes = (IsAuthenticated,)

    def post(self, request):
        payload = InitiatePaymentSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        order = get_object_or_404(Order, id=data["order_id"], customer=request.user)
        try:
            txn = initiate_payment(
                order=order,
                provider=data["provider"],
                purpose=data["purpose"],
                payer_phone_number=data.get("payer_phone_number", ""),
                payment_method=data.get("payment_method", ""),
            )
        except ValidationError as exc:
            return Response({"detail": exc.message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(TransactionSerializer(txn).data, status=status.HTTP_201_CREATED)


@method_decorator(csrf_exempt, name="dispatch")
class PaymentWebhookView(APIView):
    """
    Point d'entrée webhook générique (aucune authentification JWT — les
    agrégateurs de paiement appellent cette route directement, en s'identifiant
    via leur propre signature). Accepte `{"provider", "reference", "status"}`
    et délègue le traitement à une tâche Celery en arrière-plan, pour ne jamais
    faire attendre l'appelant (l'agrégateur) plus que nécessaire.

    En environnement de démonstration (`provider="sandbox"`, sans clé API
    réelle configurée), c'est cette route que l'on appelle manuellement (ou
    depuis le frontend) pour simuler la confirmation d'un paiement Mobile
    Money par l'agrégateur.
    """

    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        payload = WebhookEventSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        if data["provider"] != "sandbox":
            gateway = get_gateway(data["provider"])
            if not gateway.verify_webhook_signature(headers=request.headers, body=request.body):
                return Response({"detail": "Signature invalide."}, status=status.HTTP_403_FORBIDDEN)

        handle_payment_webhook.delay(
            provider=data["provider"],
            reference=data["reference"],
            provider_status=data["status"],
            raw_payload=request.data,
        )
        return Response(status=status.HTTP_202_ACCEPTED)


@method_decorator(csrf_exempt, name="dispatch")
class CinetPayWebhookView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        gateway = get_gateway("cinetpay")
        if not gateway.verify_webhook_signature(headers=request.headers, body=request.body):
            return Response({"detail": "Signature invalide."}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data
        handle_payment_webhook.delay(
            provider="cinetpay",
            reference=payload.get("transaction_id", ""),
            provider_status=payload.get("status", ""),
            raw_payload=payload,
        )
        return Response(status=status.HTTP_200_OK)


@method_decorator(csrf_exempt, name="dispatch")
class FlutterwaveWebhookView(APIView):
    permission_classes = (AllowAny,)
    authentication_classes = ()

    def post(self, request):
        gateway = get_gateway("flutterwave")
        if not gateway.verify_webhook_signature(headers=request.headers, body=request.body):
            return Response({"detail": "Signature invalide."}, status=status.HTTP_403_FORBIDDEN)

        payload = request.data.get("data", {})
        handle_payment_webhook.delay(
            provider="flutterwave",
            reference=payload.get("tx_ref", ""),
            provider_status=payload.get("status", ""),
            raw_payload=request.data,
        )
        return Response(status=status.HTTP_200_OK)
