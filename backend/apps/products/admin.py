from django.contrib import admin, messages
from django.db import transaction
from django.utils.html import format_html

from .models import Category, Product, ProductImage, ProductVariant


class ProductVariantInline(admin.TabularInline):
    model = ProductVariant
    extra = 1


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = (
        "thumbnail",
        "name",
        "product_type",
        "category",
        "base_price_xaf",
        "stock_display",
        "is_active",
        "is_featured",
    )
    list_filter = ("product_type", "is_active", "is_featured", "category")
    search_fields = ("name", "brand", "variants__sku")
    prepopulated_fields = {"slug": ("name",)}
    inlines = (ProductVariantInline, ProductImageInline)
    list_select_related = ("category",)

    def get_queryset(self, request):
        return super().get_queryset(request).prefetch_related("images", "variants")

    @admin.display(description="Photo")
    def thumbnail(self, obj: Product) -> str:
        cover = next(iter(obj.images.all()), None)
        if not cover or not cover.image:
            return "—"
        return format_html('<img src="{}" class="ie-thumb" style="width:44px;height:44px;" />', cover.image.url)

    @admin.display(description="Stock")
    def stock_display(self, obj: Product) -> str:
        total = sum(max(v.stock_quantity - v.reserved_quantity, 0) for v in obj.variants.all())
        if total <= 0:
            return format_html('<span style="color:#c0392b;font-weight:600;">Rupture</span>')
        return str(total)

    def save_formset(self, request, form, formset, change):
        if formset.model is not ProductImage:
            super().save_formset(request, form, formset, change)
            return

        # `ModelAdmin.changeform_view` enveloppe toute la sauvegarde dans une
        # transaction.atomic() unique : une exception non rattrapée ici (ex.
        # identifiants Cloudinary absents/invalides au moment de l'upload)
        # empoisonne CETTE transaction et fait échouer toute la fiche produit
        # avec un 500 générique — exactement le symptôme signalé sur
        # /admin/products/product/add/. Chaque image est donc sauvegardée
        # dans son propre savepoint : un échec d'upload isolé n'empêche plus
        # d'enregistrer le produit, ses variantes et ses autres photos.
        instances = formset.save(commit=False)
        for obj in instances:
            try:
                with transaction.atomic():
                    obj.save()
            except Exception as exc:  # noqa: BLE001 - dépend de la lib Cloudinary, pas d'un type précis
                messages.error(
                    request,
                    f"Échec de l'upload de la photo pour « {obj.product} » : {exc}. "
                    "Vérifiez MEDIA_STORAGE_BACKEND / CLOUDINARY_CLOUD_NAME / "
                    "CLOUDINARY_API_KEY / CLOUDINARY_API_SECRET.",
                )
        for obj in formset.deleted_objects:
            obj.delete()
        formset.save_m2m()


@admin.register(Category)
class CategoryAdmin(admin.ModelAdmin):
    list_display = ("name", "parent")
    prepopulated_fields = {"slug": ("name",)}
