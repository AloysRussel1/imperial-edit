import os

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand

from apps.products.models import ProductImage
from apps.sourcing.models import SourcingRequest


class Command(BaseCommand):
    help = (
        "Migre vers Cloudinary les fichiers médias (photos produits, photos de sourcing) qui "
        "n'existent encore que sur le disque local — typiquement les fichiers déposés/générés "
        "avant l'activation de MEDIA_STORAGE_BACKEND=cloudinary. Sans ce transfert, l'URL calculée "
        "par Django pointe vers un objet Cloudinary qui n'existe pas (404), donc aucune photo ne "
        "s'affiche côté frontend."
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Affiche ce qui serait migré sans rien uploader."
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        migrated = 0
        skipped = 0
        missing = 0

        for field_obj, field_name, label in self._iter_fields():
            file_field = getattr(field_obj, field_name)
            if not file_field:
                continue

            local_path = os.path.join(settings.MEDIA_ROOT, file_field.name)
            if not os.path.isfile(local_path):
                self.stdout.write(self.style.WARNING(f"[{label}] fichier local introuvable : {local_path}"))
                missing += 1
                continue

            if self._already_hosted(file_field.url):
                skipped += 1
                continue

            self.stdout.write(f"[{label}] migration : {file_field.name}")
            if dry_run:
                continue

            with open(local_path, "rb") as fh:
                file_field.save(file_field.name, ContentFile(fh.read()), save=True)
            migrated += 1

        if dry_run:
            self.stdout.write(
                self.style.WARNING(
                    f"Dry-run : {migrated + skipped} fichier(s) déjà en place ou à migrer examinés, "
                    f"{missing} introuvable(s) localement, rien modifié."
                )
            )
        else:
            self.stdout.write(
                self.style.SUCCESS(
                    f"{migrated} fichier(s) migré(s) vers Cloudinary, {skipped} déjà en place, "
                    f"{missing} introuvable(s) localement."
                )
            )

    def _iter_fields(self):
        for image in ProductImage.objects.select_related("product").all():
            yield image, "image", f"Produit {image.product.slug}"
        for req in SourcingRequest.objects.exclude(reference_image=""):
            yield req, "reference_image", f"Sourcing {req.id}"

    def _already_hosted(self, url: str) -> bool:
        try:
            resp = requests.head(url, timeout=8)
            return resp.status_code == 200
        except requests.RequestException:
            return False
