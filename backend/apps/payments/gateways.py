import hashlib
import hmac
import uuid
from abc import ABC, abstractmethod
from dataclasses import dataclass

import requests
from django.conf import settings


@dataclass
class PaymentInitiationResult:
    reference: str
    payment_url: str


class PaymentGateway(ABC):
    @abstractmethod
    def initiate_payment(
        self, *, order, amount_xaf, payer_phone_number: str, payment_method: str = ""
    ) -> PaymentInitiationResult: ...

    @abstractmethod
    def verify_webhook_signature(self, *, headers: dict, body: bytes) -> bool: ...


# CinetPay ne distingue pas MTN/Orange via un paramètre : l'agrégateur détecte
# l'opérateur à partir du préfixe du numéro de téléphone. Le paramètre
# "channels" ne sert qu'à choisir la famille de moyen de paiement.
_CINETPAY_CHANNELS = {
    "mtn_momo": "MOBILE_MONEY",
    "orange_money": "MOBILE_MONEY",
    "card": "CREDIT_CARD",
}


class CinetPayGateway(PaymentGateway):
    API_URL = "https://api-checkout.cinetpay.com/v2/payment"

    def initiate_payment(
        self, *, order, amount_xaf, payer_phone_number: str, payment_method: str = ""
    ) -> PaymentInitiationResult:
        reference = f"CP-{order.order_number}-{uuid.uuid4().hex[:6].upper()}"
        # CinetPay ramène simplement le client sur cette URL après tentative de
        # paiement (le statut définitif vient du webhook, pas de ce retour) —
        # on y glisse le numéro de commande pour que /checkout/success puisse
        # l'afficher immédiatement, sans attendre.
        return_url = f"{settings.CINETPAY_RETURN_URL}?number={order.order_number}"
        response = requests.post(
            self.API_URL,
            json={
                "apikey": settings.CINETPAY_API_KEY,
                # CINETPAY_SITE_ID n'est plus strictement exigé à la
                # configuration (voir _REAL_PROVIDER_READY_CHECKS) — replié
                # sur "sandbox" pour continuer à transmettre une valeur non
                # vide au payload plutôt qu'une chaîne vide silencieuse.
                "site_id": settings.CINETPAY_SITE_ID or "sandbox",
                "secret_key": settings.CINETPAY_SECRET_KEY,
                "transaction_id": reference,
                "amount": int(amount_xaf),
                "currency": "XAF",
                "customer_phone_number": payer_phone_number,
                "notify_url": settings.CINETPAY_NOTIFY_URL,
                "return_url": return_url,
                "channels": _CINETPAY_CHANNELS.get(payment_method, "MOBILE_MONEY"),
            },
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
        return PaymentInitiationResult(
            reference=reference, payment_url=payload.get("data", {}).get("payment_url", "")
        )

    def verify_webhook_signature(self, *, headers: dict, body: bytes) -> bool:
        """
        Vérifie la notification CinetPay via le jeton HMAC transmis dans
        l'en-tête `X-Token`, signé avec CINETPAY_SECRET_KEY.

        Durcissement recommandé avant mise en production : ne jamais faire
        confiance au statut transmis dans le corps de la notification —
        rappeler l'API CinetPay `POST /v2/payment/check` avec le
        `transaction_id` reçu pour confirmer le statut réel avant de créditer
        la commande (CinetPay le recommande explicitement, une notification
        peut être rejouée ou falsifiée même avec un token valide sur le nom
        du champ).
        """
        received_token = headers.get("X-Token", "")
        expected_token = hmac.new(
            settings.CINETPAY_SECRET_KEY.encode(), body, hashlib.sha256
        ).hexdigest()
        return hmac.compare_digest(received_token, expected_token)


class FlutterwaveGateway(PaymentGateway):
    API_URL = "https://api.flutterwave.com/v3/payments"

    def initiate_payment(
        self, *, order, amount_xaf, payer_phone_number: str, payment_method: str = ""
    ) -> PaymentInitiationResult:
        reference = f"FW-{order.order_number}-{uuid.uuid4().hex[:6].upper()}"
        response = requests.post(
            self.API_URL,
            headers={"Authorization": f"Bearer {settings.FLUTTERWAVE_SECRET_KEY}"},
            json={
                "tx_ref": reference,
                "amount": str(amount_xaf),
                "currency": "XAF",
                "payment_options": "mobilemoneycameroon",
                "customer": {"phonenumber": payer_phone_number},
                "redirect_url": settings.FLUTTERWAVE_WEBHOOK_URL,
            },
            timeout=15,
        )
        response.raise_for_status()
        payload = response.json()
        return PaymentInitiationResult(
            reference=reference, payment_url=payload.get("data", {}).get("link", "")
        )

    def verify_webhook_signature(self, *, headers: dict, body: bytes) -> bool:
        received_hash = headers.get("Verif-Hash", "")
        return hmac.compare_digest(received_hash, settings.FLUTTERWAVE_SECRET_HASH)


class SandboxGateway(PaymentGateway):
    """
    Passerelle de démonstration : aucune clé API réelle n'est configurée pour
    CinetPay/Flutterwave dans cet environnement, donc aucun appel externe n'est
    possible. Ce gateway simule l'initialisation d'un paiement Mobile Money —
    la confirmation est ensuite déclenchée manuellement via le webhook générique
    (`/api/payments/webhook/`), exactement comme le ferait un vrai agrégateur,
    ce qui permet de tester tout le flux (calculs, statuts, tâche Celery) sans
    dépendre d'un service externe.
    """

    def initiate_payment(
        self, *, order, amount_xaf, payer_phone_number: str, payment_method: str = ""
    ) -> PaymentInitiationResult:
        reference = f"SBX-{order.order_number}-{uuid.uuid4().hex[:6].upper()}"
        return PaymentInitiationResult(reference=reference, payment_url="")

    def verify_webhook_signature(self, *, headers: dict, body: bytes) -> bool:
        return True


def get_gateway(provider: str) -> PaymentGateway:
    gateways = {
        "cinetpay": CinetPayGateway,
        "flutterwave": FlutterwaveGateway,
        "sandbox": SandboxGateway,
    }
    gateway_class = gateways.get(provider)
    if gateway_class is None:
        raise ValueError(f"Agrégateur de paiement inconnu: {provider}")
    return gateway_class()
