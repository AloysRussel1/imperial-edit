from django.conf import settings
from django.core.validators import MinValueValidator
from django.db import models

from apps.common.models import BaseModel
from apps.orders.models import Order


class SourcingStatus(models.TextChoices):
    NEW = "new", "Nouvelle demande"
    UNDER_REVIEW = "under_review", "En cours d'étude"
    QUOTED = "quoted", "Devis envoyé"
    CONVERTED = "converted", "Convertie en commande"
    REJECTED = "rejected", "Refusée"


class SourcingCategory(models.TextChoices):
    BAGS = "bags", "Sacs"
    SHOES = "shoes", "Chaussures"
    CLOTHING = "clothing", "Vêtements"
    PERFUMES = "perfumes", "Parfums"
    WATCHES = "watches", "Montres"
    OTHER = "other", "Autre"


class SourcingRequest(BaseModel):
    customer = models.ForeignKey(
        settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="sourcing_requests"
    )
    product_name = models.CharField(max_length=200, blank=True)
    category = models.CharField(max_length=20, choices=SourcingCategory.choices, default=SourcingCategory.OTHER)
    size_or_shoe = models.CharField(max_length=50, blank=True)
    budget_max_xaf = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    reference_image = models.ImageField(upload_to="sourcing/", blank=True)
    source_url = models.URLField(blank=True)
    description = models.TextField(blank=True)
    status = models.CharField(max_length=20, choices=SourcingStatus.choices, default=SourcingStatus.NEW)
    quoted_price_xaf = models.DecimalField(max_digits=12, decimal_places=2, null=True, blank=True)
    admin_notes = models.TextField(blank=True)
    converted_order = models.OneToOneField(
        Order, null=True, blank=True, on_delete=models.SET_NULL, related_name="sourcing_request"
    )

    class Meta:
        db_table = "sourcing_requests"
        indexes = [models.Index(fields=["status"])]

    def __str__(self) -> str:
        return f"Sourcing #{self.id} - {self.customer}"
