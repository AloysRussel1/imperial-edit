import os
import uuid
from decimal import Decimal

from django.conf import settings
from django.core.management.base import BaseCommand
from django.db import transaction
from django.utils.text import slugify

from apps.products.models import Category, DepositPercentage, Product, ProductImage, ProductVariant

# Motifs de nommage bruts habituellement produits par un smartphone/appareil photo.
RAW_FILENAME_PREFIXES = ("IMG_", "img_", "IMG-", "img-", "DSC", "dsc")

DEFAULT_BRAND = "Lucien Rey"  # marque fictive déjà utilisée pour les chaussures du catalogue
DEFAULT_PRICE_XAF = Decimal("150000")
DEFAULT_SIZE = "42"


class Command(BaseCommand):
    help = (
        "Associe les photos brutes (IMG_*.png/.jpg, ...) déposées dans media/products/ à de "
        "nouvelles fiches produit 'Chaussures', et renomme les fichiers au format "
        "chaussure-[slug]-[id_unique].ext. Les fiches créées sont inactives (is_active=False) "
        "tant que l'équipe n'a pas complété nom réel / prix / tailles depuis l'admin Django."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Affiche les actions prévues sans rien modifier."
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        products_dir = os.path.join(settings.MEDIA_ROOT, "products")
        if not os.path.isdir(products_dir):
            self.stdout.write(self.style.ERROR(f"Dossier introuvable : {products_dir}"))
            return

        raw_files = sorted(
            f
            for f in os.listdir(products_dir)
            if f.startswith(RAW_FILENAME_PREFIXES) and os.path.isfile(os.path.join(products_dir, f))
        )
        if not raw_files:
            self.stdout.write(self.style.WARNING("Aucun fichier brut (IMG_*.*) à traiter."))
            return

        category, _ = Category.objects.get_or_create(slug="shoes", defaults={"name": "Chaussures"})
        existing_count = Product.objects.filter(product_type="shoes").count()

        with transaction.atomic():
            for offset, filename in enumerate(raw_files, start=1):
                index = existing_count + offset
                ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else "jpg"
                name = f"Chaussure Édition {index:02d}"
                base_slug = slugify(f"edition-{index:02d}")
                unique = uuid.uuid4().hex[:8]
                new_filename = f"chaussure-{base_slug}-{unique}.{ext}"

                self.stdout.write(f"{filename}  ->  {new_filename}   (produit : {name}, inactif)")

                if dry_run:
                    continue

                product = Product.objects.create(
                    category=category,
                    product_type="shoes",
                    name=name,
                    slug=f"{base_slug}-{unique}",
                    brand=DEFAULT_BRAND,
                    description=(
                        "Fiche générée automatiquement à partir d'une photo importée — "
                        "à compléter (nom réel, description, prix, tailles) depuis l'admin avant activation."
                    ),
                    base_price_xaf=DEFAULT_PRICE_XAF,
                    is_active=False,
                    is_featured=False,
                    default_deposit_percentage=DepositPercentage.FIFTY,
                )
                ProductVariant.objects.create(
                    product=product,
                    sku=f"{product.slug.upper()}-{DEFAULT_SIZE}",
                    size=DEFAULT_SIZE,
                    color="Standard",
                    stock_quantity=1,
                )

                os.rename(os.path.join(products_dir, filename), os.path.join(products_dir, new_filename))
                ProductImage.objects.create(product=product, image=f"products/{new_filename}", position=0)

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry-run : aucun fichier ni enregistrement modifié."))
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"{len(raw_files)} photo(s) renommée(s) et associée(s) à {len(raw_files)} nouvelle(s) "
                    "fiche(s) chaussure (inactives, à compléter)."
                )
            )
