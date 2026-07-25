from django.contrib import admin

from .models import NotificationLog


@admin.register(NotificationLog)
class NotificationLogAdmin(admin.ModelAdmin):
    list_display = ("channel", "recipient", "subject", "status", "related_order", "created_at")
    list_filter = ("channel", "status")
    search_fields = ("recipient", "subject", "message", "related_order__order_number")
    readonly_fields = [field.name for field in NotificationLog._meta.fields]

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
