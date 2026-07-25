import hashlib
import hmac

from django.test import override_settings

from apps.payments.gateways import CinetPayGateway


@override_settings(CINETPAY_SECRET_KEY="test-secret")
def test_cinetpay_signature_verification():
    gateway = CinetPayGateway()
    body = b'{"transaction_id": "CP-TEST", "status": "ACCEPTED"}'
    valid_token = hmac.new(b"test-secret", body, hashlib.sha256).hexdigest()

    assert gateway.verify_webhook_signature(headers={"X-Token": valid_token}, body=body) is True
    assert gateway.verify_webhook_signature(headers={"X-Token": "wrong"}, body=body) is False
