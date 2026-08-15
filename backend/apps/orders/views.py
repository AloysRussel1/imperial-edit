from django.core.exceptions import ValidationError
from rest_framework import mixins, serializers, status, viewsets
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.common.permissions import IsAdminRole, IsOwnerOrAdmin, IsPosStaff, IsVendorOrAdmin
from apps.payments.models import Transaction, TransactionStatus
from apps.promotions.services import apply_coupon
from apps.sourcing.selectors import list_pending_requests

from .models import Cart, Order, OrderItem, OrderItemFulfillmentStatus, OrderStatus
from .selectors import dashboard_financial_summary, get_order_for_tracking, list_orders_for_customer
from .serializers import (
    CheckoutSerializer,
    CreateOrderSerializer,
    OrderSerializer,
    OrderTrackingSerializer,
    POSCheckoutSerializer,
    VendorOrderItemSerializer,
)
from .services import (
    advance_logistics_status,
    cancel_order,
    create_order_from_cart,
    create_order_from_items,
    create_pos_order,
    register_payment,
)


class AdvanceStatusSerializer(serializers.Serializer):
    status = serializers.ChoiceField(choices=OrderStatus.choices)
    note = serializers.CharField(required=False, allow_blank=True, default="")


class SettleBalanceSerializer(serializers.Serializer):
    payment_method = serializers.ChoiceField(
        choices=["cash_on_delivery", "momo_on_delivery"], default="cash_on_delivery"
    )


class OrderViewSet(viewsets.ModelViewSet):
    serializer_class = OrderSerializer
    permission_classes = (IsAuthenticated, IsOwnerOrAdmin)
    http_method_names = ("get", "post", "head", "options")

    def get_queryset(self):
        user = self.request.user
        if user.role == "admin":
            return Order.objects.select_related("customer").prefetch_related("items").order_by("-created_at")
        return list_orders_for_customer(user)

    def create(self, request, *args, **kwargs):
        payload = CreateOrderSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        cart = Cart.objects.filter(id=data["cart_id"], customer=request.user, is_active=True).first()
        if cart is None:
            return Response({"detail": "Panier introuvable."}, status=status.HTTP_404_NOT_FOUND)

        discount = 0
        coupon_code = data.get("coupon_code", "")
        if coupon_code:
            discount = apply_coupon(code=coupon_code, cart=cart)

        try:
            order = create_order_from_cart(
                cart=cart,
                deposit_percentage=data["deposit_percentage"],
                shipping_address=data["shipping_address"],
                delivery_city=data["delivery_city"],
                discount_xaf=discount,
                coupon_code=coupon_code,
            )
        except ValidationError as exc:
            return Response({"detail": exc.message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"])
    def checkout(self, request):
        """
        Crée une commande directement à partir des articles du panier client
        (le panier de cette boutique est géré côté frontend, pas en base) et
        réserve le stock correspondant. Étape 1 du tunnel de paiement — à
        enchaîner avec `POST /api/payments/initiate/` pour lancer le paiement
        de l'acompte (ou du montant intégral).
        """
        payload = CheckoutSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        try:
            order = create_order_from_items(
                customer=request.user,
                items=data["items"],
                deposit_percentage=data["deposit_percentage"],
                shipping_address=data["shipping_address"],
                delivery_city=data["delivery_city"],
                payment_method=data.get("payment_method", ""),
            )
        except ValidationError as exc:
            return Response({"detail": exc.message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["post"], permission_classes=(IsPosStaff,))
    def pos(self, request):
        """
        Vente comptoir (`/api/orders/pos/`) — caissier·e, vendeur·se ou admin.
        À la différence de `checkout` (tunnel en ligne, acompte + réservation
        de stock), la vente est réglée intégralement et sur-le-champ : le
        stock est décompté directement et la commande ressort déjà
        "Livré & soldé" (voir `create_pos_order`).
        """
        payload = POSCheckoutSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        data = payload.validated_data

        try:
            order = create_pos_order(
                cashier=request.user,
                items=data["items"],
                payment_method=data["payment_method"],
                customer_email=data.get("customer_email", ""),
            )
        except ValidationError as exc:
            return Response({"detail": exc.message}, status=status.HTTP_400_BAD_REQUEST)

        return Response(OrderSerializer(order).data, status=status.HTTP_201_CREATED)

    @action(detail=False, methods=["get"], url_path="my-orders")
    def my_orders(self, request):
        """
        Toujours restreint aux commandes du compte connecté, quel que soit son
        rôle — contrairement à la liste de base qui s'élargit pour un admin.
        """
        orders = list_orders_for_customer(request.user)
        return Response(OrderSerializer(orders, many=True).data)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        cancel_order(order)
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], permission_classes=(IsAdminRole,))
    def advance_status(self, request, pk=None):
        """Back-office : fait passer une commande à l'étape logistique choisie,
        avec une note de suivi optionnelle affichée sur la frise du client."""
        payload = AdvanceStatusSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        order = self.get_object()
        advance_logistics_status(
            order,
            payload.validated_data["status"],
            note=payload.validated_data["note"],
            changed_by=request.user,
        )
        return Response(OrderSerializer(order).data)

    @action(detail=True, methods=["post"], permission_classes=(IsAdminRole,))
    def settle_balance(self, request, pk=None):
        """
        Back-office : enregistre le règlement du solde restant à la livraison
        (espèces ou Mobile Money remis en main propre au livreur) — pas de
        passerelle de paiement en ligne impliquée ici.
        """
        payload = SettleBalanceSerializer(data=request.data)
        payload.is_valid(raise_exception=True)
        order = self.get_object()

        remaining = order.amount_remaining_xaf
        if remaining <= 0:
            return Response({"detail": "Cette commande est déjà soldée."}, status=status.HTTP_400_BAD_REQUEST)

        Transaction.objects.create(
            order=order,
            provider=payload.validated_data["payment_method"],
            purpose="balance",
            status=TransactionStatus.SUCCESS,
            amount_xaf=remaining,
            provider_reference=f"MANUAL-{order.order_number}-BALANCE",
        )
        register_payment(order, remaining)
        return Response(OrderSerializer(order).data)


class OrderTrackingView(APIView):
    """
    Suivi de colis public — accessible sans compte, à partir du seul
    `tracking_number` (`IC-2026-X89B`) ou, pour les liens internes déjà
    authentifiés, de l'`id` technique de la commande. Le code de suivi fait
    office d'autorisation (comme pour un colis postal) : voir la note de
    sécurité sur `OrderTrackingSerializer`.
    """

    permission_classes = (AllowAny,)

    def get(self, request, lookup: str):
        order = get_order_for_tracking(lookup)
        if order is None:
            return Response({"detail": "Aucune commande ne correspond à ce numéro de suivi."}, status=404)
        serializer = OrderTrackingSerializer(order, context={"request": request})
        return Response(serializer.data)


class AdminDashboardSummaryView(APIView):
    """KPIs consolidés pour le tableau de bord administrateur."""

    permission_classes = (IsAdminRole,)

    def get(self, request):
        finance = dashboard_financial_summary()
        terminal_statuses = [OrderStatus.DELIVERED_AND_COMPLETED, OrderStatus.CANCELLED]
        return Response(
            {
                **finance,
                "orders_count": Order.objects.count(),
                "active_orders_count": Order.objects.exclude(status__in=terminal_statuses).count(),
                "pending_sourcing_count": list_pending_requests().count(),
            }
        )


class VendorOrderItemViewSet(mixins.ListModelMixin, viewsets.GenericViewSet):
    """
    Lignes de commande à préparer pour le vendeur connecté — jamais la
    commande entière (qui peut mélanger les articles de plusieurs vendeurs),
    seulement ses propres lignes. Un admin voit toutes les lignes de toute la
    plateforme, comme partout ailleurs.
    """

    serializer_class = VendorOrderItemSerializer
    permission_classes = (IsAuthenticated, IsVendorOrAdmin)

    def get_queryset(self):
        base = (
            OrderItem.objects.select_related("order", "order__customer", "variant", "variant__product")
            .order_by("-order__created_at")
        )
        user = self.request.user
        if user.role == "admin":
            return base
        return base.filter(variant__product__vendor=user)

    @action(detail=True, methods=["post"], url_path="update-fulfillment")
    def update_fulfillment(self, request, pk=None):
        item = self.get_object()
        new_status = request.data.get("fulfillment_status")
        if new_status not in OrderItemFulfillmentStatus.values:
            return Response(
                {"detail": f"Statut invalide. Valeurs possibles : {', '.join(OrderItemFulfillmentStatus.values)}."},
                status=status.HTTP_400_BAD_REQUEST,
            )
        item.fulfillment_status = new_status
        item.save(update_fields=["fulfillment_status"])
        return Response(VendorOrderItemSerializer(item).data)
