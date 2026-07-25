from .models import Transaction


def get_transaction_by_reference(reference: str) -> Transaction | None:
    return Transaction.objects.filter(provider_reference=reference).select_related("order").first()
