from django.db.models import F, QuerySet

from .models import Product, ProductVariant


def list_active_products() -> QuerySet[Product]:
    return Product.objects.filter(is_active=True).select_related("category")


def get_product_detail(slug: str) -> Product | None:
    return (
        Product.objects.filter(slug=slug)
        .select_related("category")
        .prefetch_related("images", "variants")
        .first()
    )


def list_low_stock_variants(threshold: int = 5) -> QuerySet[ProductVariant]:
    return (
        ProductVariant.objects.select_related("product")
        .annotate(available=F("stock_quantity") - F("reserved_quantity"))
        .filter(available__lte=threshold)
    )
