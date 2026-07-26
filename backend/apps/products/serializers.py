from rest_framework import serializers

from .models import Category, Product, ProductImage, ProductVariant


class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = ("id", "name", "slug", "parent")


class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ("id", "image", "position")


class ProductVariantSerializer(serializers.ModelSerializer):
    price_xaf = serializers.DecimalField(max_digits=12, decimal_places=2, read_only=True)
    available_quantity = serializers.IntegerField(read_only=True)
    is_in_stock = serializers.BooleanField(read_only=True)

    class Meta:
        model = ProductVariant
        fields = (
            "id",
            "sku",
            "size",
            "color",
            "price_override_xaf",
            "price_xaf",
            "stock_quantity",
            "available_quantity",
            "is_in_stock",
        )


class ProductDetailSerializer(serializers.ModelSerializer):
    variants = ProductVariantSerializer(many=True, read_only=True)
    images = ProductImageSerializer(many=True, read_only=True)
    category = CategorySerializer(read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
    # Lecture seule : l'attribution du vendeur est décidée côté serveur
    # (perform_create), jamais fournie par le client.
    vendor_email = serializers.EmailField(source="vendor.email", read_only=True, default=None)

    class Meta:
        model = Product
        fields = (
            "id",
            "name",
            "slug",
            "product_type",
            "brand",
            "description",
            "category",
            "base_price_xaf",
            "compare_at_price_xaf",
            "is_on_sale",
            "is_active",
            "is_featured",
            "default_deposit_percentage",
            "images",
            "variants",
            "vendor_email",
        )
