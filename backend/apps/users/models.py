import random
from datetime import timedelta

from django.contrib.auth.models import AbstractUser
from django.conf import settings
from django.db import models
from django.utils import timezone

from apps.common.models import BaseModel, UUIDModel


class UserRole(models.TextChoices):
    # Hiérarchie à 3 niveaux : ADMIN (plateforme) > VENDOR (boutique) >
    # CASHIER (caisse de cette boutique). Chaque niveau hérite des capacités
    # du niveau qu'il gère — jamais l'inverse — voir apps.common.permissions.
    ADMIN = "admin", "Administrateur"
    VENDOR = "vendor", "Vendeur"
    CASHIER = "cashier", "Caissier"
    CUSTOMER = "customer", "Client"


class User(UUIDModel, AbstractUser):
    role = models.CharField(max_length=20, choices=UserRole.choices, default=UserRole.CUSTOMER)
    # Uniquement significatif pour role="cashier" : le compte vendeur qui a
    # créé ce caissier (voir VendorCashierSerializer) — détermine quel
    # vendeur le voit dans "Mon Personnel / Caissiers" (/api/vendor/cashiers/).
    # `related_name="cashiers"` : `some_vendor.cashiers.all()`.
    managed_by = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.SET_NULL, related_name="cashiers"
    )
    phone_number = models.CharField(max_length=20, blank=True)
    whatsapp_number = models.CharField(max_length=20, blank=True)
    city = models.CharField(max_length=100, blank=True)
    country = models.CharField(max_length=100, default="Cameroun")
    # Distinct de `is_active` (qui gouverne réellement la connexion — voir
    # RegisterSerializer.create) : ce champ ne sert qu'à savoir si l'adresse
    # a un jour été confirmée par code OTP, pour l'affichage/l'audit.
    is_email_verified = models.BooleanField(default=False)

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


def _generate_otp_code() -> str:
    return f"{random.randint(0, 999999):06d}"


class EmailVerificationOTP(BaseModel):
    """
    Code à 6 chiffres envoyé par e-mail (Brevo) à l'inscription — le compte
    reste `is_active=False` (voir RegisterSerializer) tant qu'aucun code
    valide n'a été soumis à /api/auth/verify-email/.
    """

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="email_otps")
    code = models.CharField(max_length=6, default=_generate_otp_code)
    is_used = models.BooleanField(default=False)
    # Incrémenté à chaque code erroné soumis pour ce compte — au-delà de
    # MAX_ATTEMPTS, ce code précis est grillé même s'il n'a pas expiré,
    # pour limiter la force brute sur un espace de seulement 10^6 valeurs.
    attempts = models.PositiveSmallIntegerField(default=0)

    MAX_ATTEMPTS = 5
    VALIDITY_MINUTES = 15

    class Meta:
        db_table = "email_verification_otps"
        indexes = [models.Index(fields=["user", "is_used"])]

    def __str__(self) -> str:
        return f"OTP {self.code} — {self.user.email}"

    @property
    def is_expired(self) -> bool:
        return timezone.now() > self.created_at + timedelta(minutes=self.VALIDITY_MINUTES)

    @property
    def is_valid(self) -> bool:
        return not self.is_used and not self.is_expired and self.attempts < self.MAX_ATTEMPTS
