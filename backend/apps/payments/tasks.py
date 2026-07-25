from celery import shared_task

from .services import process_webhook_event


@shared_task
def handle_payment_webhook(*, provider: str, reference: str, provider_status: str, raw_payload: dict) -> None:
    process_webhook_event(
        provider=provider, reference=reference, provider_status=provider_status, raw_payload=raw_payload
    )
