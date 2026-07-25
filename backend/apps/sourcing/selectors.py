from .models import SourcingRequest


def list_requests_for_customer(customer):
    return SourcingRequest.objects.filter(customer=customer).order_by("-created_at")


def list_pending_requests():
    return SourcingRequest.objects.exclude(status__in=["converted", "rejected"]).order_by("created_at")
