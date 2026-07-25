from django.contrib import admin

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
        "status",
        "deposit_percentage",
        "total_xaf",
        "amount_paid_xaf",
        "amount_remaining_xaf",
        "created_at",
    )
    list_filter = ("status", "deposit_percentage")
    search_fields = ("order_number", "customer__email")
    inlines = (OrderItemInline,)
    readonly_fields = ("order_number", "subtotal_xaf", "total_xaf")


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ("customer", "is_active", "created_at")
    inlines = (CartItemInline,)
