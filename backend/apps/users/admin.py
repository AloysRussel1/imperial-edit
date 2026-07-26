from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "phone_number", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-date_joined",)
    # `DjangoUserAdmin.fieldsets` par défaut n'inclut aucun champ métier
    # personnalisé (role, whatsapp_number, city...) dans le formulaire
    # d'édition — seulement dans list_display. Sans ce complément, `role`
    # (donc la promotion d'un compte en Vendeur) n'était pas modifiable
    # depuis l'admin, seulement visible en lecture dans la liste.
    fieldsets = DjangoUserAdmin.fieldsets + (
        ("Rôle & profil Imperial Collection", {
            "fields": ("role", "phone_number", "whatsapp_number", "city", "country"),
        }),
    )
