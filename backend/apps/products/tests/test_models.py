import pytest

from apps.products.models import Category, Product, ProductVariant


@pytest.mark.django_db
def test_variant_available_quantity_excludes_reserved():
    category = Category.objects.create(name="Sacs", slug="sacs")
    product = Product.objects.create(
        category=category,
        product_type="bags",
        name="Sac Impérial",
        slug="sac-imperial",
        base_price_xaf=250000,
    )
    variant = ProductVariant.objects.create(
        product=product, sku="SAC-001", stock_quantity=10, reserved_quantity=3
    )
    assert variant.available_quantity == 7
    assert variant.is_in_stock is True
