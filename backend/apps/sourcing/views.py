from django.core.exceptions import ValidationError
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.permissions import IsAdminRole, IsOwnerOrAdmin, IsVendorOrAdmin
from apps.orders.serializers import OrderSerializer

from .models import SourcingRequest, SourcingStatus
from .selectors import list_requests_for_customer
from .serializers import (
    ConvertSourcingRequestSerializer,
    CreateSourcingRequestSerializer,
    QuoteSourcingRequestSerializer,
    RejectSourcingRequestSerializer,
    SourcingRequestSerializer,
)
from .services import convert_to_order, quote_sourcing_request, reject_sourcing_request, submit_sourcing_request
from .tasks import notify_admin_new_sourcing_request


class SourcingRequestViewSet(viewsets.ModelViewSet):
    permission_classes = (IsAuthenticated, IsOwnerOrAdmin)
    http_method_names = ("get", "post", "head", "options")

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return SourcingRequest.objects.select_related("customer").order_by("-created_at")
        if user.role == "vendor":
            # Un vendeur ne voit que les demandes encore ouvertes (jamais celles
            # déjà devisées/converties/refusées par l'admin ou un autre vendeur) —
            # évite d'écraser un devis existant et une file encombrée de bruit.
            return SourcingRequest.objects.filter(
                status__in=[SourcingStatus.NEW, SourcingStatus.UNDER_REVIEW]
            ).select_related("customer").order_by("created_at")
        return list_requests_for_customer(user)

    def get_serializer_class(self):
        if self.action == "create":
            return CreateSourcingRequestSerializer
        return SourcingRequestSerializer

    def create(self, request, *args, **kwargs):
        payload = CreateSourcingRequestSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        obj = submit_sourcing_request(customer=request.user, **payload.validated_data)
        notify_admin_new_sourcing_request.delay(str(obj.id))
        serializer = SourcingRequestSerializer(obj, context=self.get_serializer_context())
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["post"], permission_classes=(IsVendorOrAdmin,))
    def quote(self, request, pk=None):
        payload = QuoteSourcingRequestSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        obj = quote_sourcing_request(self.get_object(), **payload.validated_data)
        return Response(SourcingRequestSerializer(obj, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"], permission_classes=(IsAdminRole,))
    def reject(self, request, pk=None):
        payload = RejectSourcingRequestSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        obj = reject_sourcing_request(self.get_object(), **payload.validated_data)
        return Response(SourcingRequestSerializer(obj, context=self.get_serializer_context()).data)

    @action(detail=True, methods=["post"], permission_classes=(IsAdminRole,))
    def convert(self, request, pk=None):
        payload = ConvertSourcingRequestSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        try:
            order = convert_to_order(self.get_object(), **payload.validated_data)
        except ValidationError as exc:
            return Response({"detail": exc.message}, status=status.HTTP_400_BAD_REQUEST)
        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)
