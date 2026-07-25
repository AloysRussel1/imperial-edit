from django.contrib import admin

from .models import Transaction


@admin.register(Transaction)
class TransactionAdmin(admin.ModelAdmin):
    list_display = ("provider_reference", "order", "provider", "purpose", "status", "amount_xaf", "created_at")
    list_filter = ("provider", "purpose", "status")
    search_fields = ("provider_reference", "order__order_number")
    readonly_fields = ("raw_payload",)
