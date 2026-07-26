from django.contrib.auth.models import AbstractUser
from django.db import models

from apps.common.models import UUIDModel


class UserRole(models.TextChoices):
    ADMIN = "admin", "Administrateur"
    VENDOR = "vendor", "Vendeur"
    CUSTOMER = "customer", "Client"


class User(UUIDModel, AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    phone_number = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="Cameroun")

    class Meta:
        db_table = "users"

    @property
    def is_admin_role(self) -> bool:
        return self.role == UserRole.ADMIN
