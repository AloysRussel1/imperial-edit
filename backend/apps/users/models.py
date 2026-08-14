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

    def save(self, *args, **kwargs):
        # Droits cumulatifs : un compte promu role="admin" (ex. depuis le
        # formulaire UserAdmin, où `role` et `is_staff` sont deux champs
        # distincts qu'il est facile de ne pas cocher ensemble) doit toujours
        # pouvoir se connecter à /admin/ — jamais un lien "Administration
        # Django" qui mène à une impasse pour un admin légitime.
        if self.role == UserRole.ADMIN:
            self.is_staff = True
        super().save(*args, **kwargs)
