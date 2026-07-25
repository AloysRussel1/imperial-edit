from django.contrib import admin

from .models import Category, Product, ProductImage, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ("name", "product_type", "category", "base_price_xaf", "is_active", "is_featured")
    list_filter = ("product_type", "is_active", "is_featured", "category")
    search_fields = ("name", "brand", "variants__sku")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (ProductVariantInline, ProductImageInline)


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent")
    prepopulated_fields = {"slug": ("name",)}
