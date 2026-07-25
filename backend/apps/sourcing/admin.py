from django.contrib import admin
from django.utils.html import format_html

from .models import SourcingRequest


@admin.register(SourcingRequest)
class SourcingRequestAdmin(admin.ModelAdmin):
    list_display = (
        "thumbnail",
        "product_name",
        "customer",
        "category",
        "budget_display",
        "status_badge",
        "quoted_price_xaf",
        "created_at",
    )
    list_filter = ("status", "category")
    search_fields = ("customer__email", "customer__first_name", "customer__last_name", "product_name", "description")
    readonly_fields = ("converted_order", "image_preview")
    date_hierarchy = "created_at"
    fieldsets = (
        ("Demande du client", {
            "fields": (
                "image_preview",
                "reference_image",
                "customer",
                "product_name",
                "category",
                "size_or_shoe",
                "budget_max_xaf",
                "source_url",
                "description",
            )
        }),
        ("Traitement", {"fields": ("status", "quoted_price_xaf", "admin_notes", "converted_order")}),
    )

    @admin.display(description="Photo")
    def thumbnail(self, obj: SourcingRequest) -> str:
        if not obj.reference_image:
            return "—"
        return format_html(
            '<img src="{}" class="ie-thumb" style="width:48px;height:48px;" />', obj.reference_image.url
        )

    @admin.display(description="Aperçu")
    def image_preview(self, obj: SourcingRequest) -> str:
        if not obj.reference_image:
            return "Aucune photo envoyée par le client."
        return format_html(
            '<img src="{}" class="ie-thumb" style="max-width:320px;max-height:320px;" />', obj.reference_image.url
        )

    @admin.display(description="Budget")
    def budget_display(self, obj: SourcingRequest) -> str:
        if obj.budget_max_xaf is None:
            return "—"
        return f"{obj.budget_max_xaf:,.0f} XAF".replace(",", " ")

    @admin.display(description="Statut")
    def status_badge(self, obj: SourcingRequest) -> str:
        colors = {
            "new": "#d39e00",
            "under_review": "#17a2b8",
            "quoted": "#c9a24b",
            "converted": "#28a745",
            "rejected": "#6c757d",
        }
        color = colors.get(obj.status, "#6c757d")
        return format_html(
            '<span style="background:{}; color:#0b0b0c; padding:2px 10px; border-radius:10px; '
            'font-size:11px; font-weight:600;">{}</span>',
            color,
            obj.get_status_display(),
        )
