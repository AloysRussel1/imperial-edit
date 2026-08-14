from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import EmailVerificationOTP, User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "phone_number", "is_active", "is_email_verified")
    list_filter = ("role", "is_active", "is_email_verified")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-date_joined",)
    # `DjangoUserAdmin.fieldsets` par défaut n'inclut aucun champ métier
    # personnalisé (role, whatsapp_number, city...) dans le formulaire
    # d'édition — seulement dans list_display. Sans ce complément, `role`
    # (donc la promotion d'un compte en Vendeur) n'était pas modifiable
    # depuis l'admin, seulement visible en lecture dans la liste.
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Rôle & profil Imperial Collection", {
            "fields": ("role", "phone_number", "whatsapp_number", "city", "country", "is_email_verified"),
        }),
    )


@admin.register(EmailVerificationOTP)
class EmailVerificationOTPAdmin(admin.ModelAdmin):
    """Lecture seule : ces codes sont générés/consommés uniquement par le
    flux d'inscription, jamais créés ou modifiés à la main depuis l'admin."""

    list_display = ("user", "code", "is_used", "attempts", "created_at")
    list_filter = ("is_used",)
    search_fields = ("user__email", "code")
    readonly_fields = ("user", "code", "is_used", "attempts", "created_at", "updated_at")

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False
