import uuid

from django.core.validators import MinValueValidator
from django.db import models
from django.utils.text import slugify

from apps.common.models import BaseModel


class ProductCategory(models.TextChoices):
    BAGS = "bags", "Sacs"
    SHOES = "shoes", "Chaussures"
    CLOTHING = "clothing", "Vêtements"
    PERFUMES = "perfumes", "Parfums"
    WATCHES = "watches", "Montres"


# Préfixe de fichier normalisé par catégorie — utilisé par `product_image_upload_to`
# pour que chaque photo uploadée porte un nom propre (ex. "chaussure-sneakers-aerial-3f9c2b1a.jpg")
# au lieu du nom brut fourni par l'appareil/l'utilisateur (ex. "IMG_9253.png").
PRODUCT_TYPE_FILE_PREFIX = {
    ProductCategory.BAGS: "sac",
    ProductCategory.SHOES: "chaussure",
    ProductCategory.CLOTHING: "vetement",
    ProductCategory.PERFUMES: "parfum",
    ProductCategory.WATCHES: "montre",
}


def product_image_upload_to(instance: "ProductImage", filename: str) -> str:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
    product = instance.product
    prefix = PRODUCT_TYPE_FILE_PREFIX.get(product.product_type, slugify(product.product_type or "produit"))
    base_slug = slugify(product.slug or product.name or "produit")
    # Évite un préfixe dupliqué quand le slug produit commence déjà par le mot de catégorie
    # (ex. slug "sac-aurore" en catégorie "bags" → "sac-aurore-xxxx", pas "sac-sac-aurore-xxxx").
    stem = base_slug if base_slug == prefix or base_slug.startswith(f"{prefix}-") else f"{prefix}-{base_slug}"
    unique = uuid.uuid4().hex[:8]
    return f"products/{stem}-{unique}.{ext}"


class DepositPercentage(models.IntegerChoices):
    FIFTY = 50, "50%"
    SEVENTY = 70, "70%"


class Category(BaseModel):
    name = models.CharField(max_length=120, unique=True)
    slug = models.SlugField(max_length=140, unique=True)
    parent = models.ForeignKey(
        "self", null=True, blank=True, on_delete=models.CASCADE, related_name="children"
    )

    class Meta:
        db_table = "categories"
        verbose_name_plural = "categories"

    def __str__(self) -> str:
        return self.name


class Product(BaseModel):
    category = models.ForeignKey(Category, on_delete=models.PROTECT, related_name="products")
    product_type = models.CharField(max_length=20, choices=ProductCategory.choices)
    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=220, unique=True)
    brand = models.CharField(max_length=120, blank=True)
    description = models.TextField(blank=True)
    base_price_xaf = models.DecimalField(max_digits=12, decimal_places=2, validators=[MinValueValidator(0)])
    compare_at_price_xaf = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    is_active = models.BooleanField(default=True)
    is_featured = models.BooleanField(default=False)
    default_deposit_percentage = models.IntegerField(
        choices=DepositPercentage.choices, default=DepositPercentage.FIFTY
    )

    class Meta:
        db_table = "products"
        indexes = [models.Index(fields=["product_type", "is_active"])]

    def __str__(self) -> str:
        return self.name

    @property
    def is_on_sale(self) -> bool:
        return bool(self.compare_at_price_xaf and self.compare_at_price_xaf > self.base_price_xaf)


class ProductImage(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="images")
    image = models.ImageField(upload_to=product_image_upload_to)
    position = models.PositiveSmallIntegerField(default=0)

    class Meta:
        db_table = "product_images"
        ordering = ["position"]


class ProductVariant(BaseModel):
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name="variants")
    sku = models.CharField(max_length=64, unique=True)
    size = models.CharField(max_length=20, blank=True)
    color = models.CharField(max_length=50, blank=True)
    price_override_xaf = models.DecimalField(
        max_digits=12, decimal_places=2, null=True, blank=True, validators=[MinValueValidator(0)]
    )
    stock_quantity = models.PositiveIntegerField(default=0)
    reserved_quantity = models.PositiveIntegerField(default=0)

    class Meta:
        db_table = "product_variants"
        constraints = [
            models.UniqueConstraint(fields=["product", "size", "color"], name="unique_variant_per_product")
        ]

    def __str__(self) -> str:
        return f"{self.product.name} - {self.size or '-'} / {self.color or '-'} ({self.sku})"

    @property
    def price_xaf(self):
        return self.price_override_xaf or self.product.base_price_xaf

    @property
    def available_quantity(self) -> int:
        return max(self.stock_quantity - self.reserved_quantity, 0)

    @property
    def is_in_stock(self) -> bool:
        return self.available_quantity > 0
