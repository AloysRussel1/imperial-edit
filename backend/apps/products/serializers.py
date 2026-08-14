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


class VendorProductVariantSerializer(serializers.ModelSerializer):
    # PK explicitement redéclarée en écriture (optionnelle) : DRF génère par
    # défaut un champ `id` en lecture seule pour la clé primaire, ce qui
    # empêcherait le vendeur de cibler une variante existante à mettre à jour
    # (voir VendorProductWriteSerializer.update — omis => création).
    id = serializers.UUIDField(required=False)
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


class VendorProductWriteSerializer(serializers.ModelSerializer):
    """
    CRUD self-service pour un vendeur : variantes en écriture imbriquée
    (remplacement complet à chaque update, comme l'inline formset de l'admin
    Django) ; les images ne se gèrent pas ici (upload multipart séparé, voir
    VendorProductViewSet.upload_image) et le vendeur associé n'est jamais
    fourni par le client (décidé côté vue, perform_create).
    """

    variants = VendorProductVariantSerializer(many=True, required=False)
    images = ProductImageSerializer(many=True, read_only=True)
    is_on_sale = serializers.BooleanField(read_only=True)
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
        read_only_fields = ("id",)

    def create(self, validated_data):
        variants_data = validated_data.pop("variants", [])
        product = Product.objects.create(**validated_data)
        for variant_data in variants_data:
            variant_data.pop("id", None)  # une création ne peut jamais réutiliser un id existant
            ProductVariant.objects.create(product=product, **variant_data)
        return product

    def update(self, instance, validated_data):
        variants_data = validated_data.pop("variants", None)
        for attr, value in validated_data.items():
            setattr(instance, attr, value)
        instance.save()

        if variants_data is not None:
            kept_ids = {v["id"] for v in variants_data if v.get("id")}
            instance.variants.exclude(id__in=kept_ids).delete()
            for variant_data in variants_data:
                variant_id = variant_data.pop("id", None)
                if variant_id:
                    ProductVariant.objects.filter(id=variant_id, product=instance).update(**variant_data)
                else:
                    ProductVariant.objects.create(product=instance, **variant_data)
        return instance


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
