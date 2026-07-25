from django.contrib import admin

from .models import SourcingRequest


@admin.register(SourcingRequest)
class SourcingRequestAdmin(admin.ModelAdmin):
    list_display = ("id", "customer", "status", "quoted_price_xaf", "created_at")
    list_filter = ("status",)
    search_fields = ("customer__email", "description")
    readonly_fields = ("converted_order",)
