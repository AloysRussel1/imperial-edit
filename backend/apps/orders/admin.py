from django.contrib import admin
from django.utils.html import format_html

from .models import Cart, CartItem, Order, OrderItem


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ("product_name_snapshot", "sku_snapshot", "unit_price_xaf", "quantity")


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = (
        "order_number",
        "customer",
        "total_amount_display",
        "deposit_amount_display",
        "amount_paid_xaf",
        "status_badge",
        "payment_method",
        "created_at",
    )
    list_filter = ("status", "payment_method", "deposit_percentage", "delivery_city")
    search_fields = ("order_number", "customer__email", "customer__first_name", "customer__last_name")
    date_hierarchy = "created_at"
    inlines = (OrderItemInline,)
    readonly_fields = ("order_number", "subtotal_xaf", "total_xaf", "amount_remaining_display", "deposit_due_display")
    fieldsets = (
        ("Commande", {"fields": ("order_number", "customer", "status", "payment_method")}),
        (
            "Montants",
            {
                "fields": (
                    "currency",
                    "subtotal_xaf",
                    "discount_xaf",
                    "total_xaf",
                    "deposit_percentage",
                    "deposit_due_display",
                    "amount_paid_xaf",
                    "amount_remaining_display",
                )
            },
        ),
        ("Livraison", {"fields": ("shipping_address", "delivery_city", "tracking_notes")}),
        ("Suivi", {"fields": ("coupon_code", "reservation_expires_at")}),
    )

    @admin.display(description="Total")
    def total_amount_display(self, obj: Order) -> str:
        return f"{obj.total_xaf:,.0f} {obj.currency}".replace(",", " ")

    @admin.display(description="Acompte dû")
    def deposit_amount_display(self, obj: Order) -> str:
        return f"{obj.deposit_due_xaf:,.0f} {obj.currency}".replace(",", " ")

    @admin.display(description="Solde restant")
    def amount_remaining_display(self, obj: Order) -> str:
        return f"{obj.amount_remaining_xaf:,.0f} {obj.currency}".replace(",", " ")

    @admin.display(description="Acompte dû")
    def deposit_due_display(self, obj: Order) -> str:
        return f"{obj.deposit_due_xaf:,.0f} {obj.currency}".replace(",", " ")

    @admin.display(description="Statut")
    def status_badge(self, obj: Order) -> str:
        colors = {
            "pending_deposit": "#d39e00",
            "deposit_paid": "#17a2b8",
            "in_transit": "#17a2b8",
            "ready_for_delivery": "#c9a24b",
            "completed": "#28a745",
            "cancelled": "#6c757d",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{}; color:#0b0b0c; padding:2px 10px; border-radius:10px; '
            'font-size:11px; font-weight:600;">{}</span>',
            color,
            obj.get_status_display(),
        )


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("customer", "is_active", "created_at")
    inlines = (CartItemInline,)
