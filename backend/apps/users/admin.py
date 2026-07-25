from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as DjangoUserAdmin

from .models import User


@admin.register(User)
class UserAdmin(DjangoUserAdmin):
    list_display = ("email", "first_name", "last_name", "role", "phone_number", "is_active")
    list_filter = ("role", "is_active")
    search_fields = ("email", "first_name", "last_name", "phone_number")
    ordering = ("-date_joined",)
