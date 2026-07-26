from decimal import Decimal

import requests
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.products.models import Category, Product, ProductImage, ProductVariant
from apps.users.models import User, UserRole

# Photographies Unsplash vérifiées (licence libre) — mêmes clichés que la maquette
# frontend, pour une identité visuelle cohérente une fois le catalogue branché sur l'API.
UNSPLASH_PARAMS = "q=80&w=1600&auto=format&fit=crop"


def unsplash(photo_id: str) -> str:
    return f"https://images.unsplash.com/{photo_id}?{UNSPLASH_PARAMS}"


CATEGORIES = [
    {"name": "Sacs", "slug": "bags"},
    {"name": "Chaussures", "slug": "shoes"},
    {"name": "Vêtements", "slug": "clothing"},
    {"name": "Parfums", "slug": "perfumes"},
    {"name": "Montres", "slug": "watches"},
]

PRODUCTS = [
    {
        "slug": "sac-aurore",
        "name": "Sac Aurore",
        "brand": "Maison Devereux",
        "product_type": "bags",
        "price_eur": Decimal("690"),
        "compare_price_eur": Decimal("780"),
        "is_featured": True,
        "deposit_percentage": 70,
        "description": (
            "Cuir grainé pleine fleur rouge cerise, quincaillerie plaquée or et doublure en toile "
            "signature. Une pièce d'exception façonnée à la main par nos ateliers partenaires parisiens."
        ),
        "images": [
            ("photo-1584917865442-de89df76afd3", "Sac Aurore en cuir rouge, vue de face"),
            ("photo-1589363358751-ab05797e5629", "Sac Aurore, détail bandoulière"),
            ("photo-1589731119540-c4586781dae1", "Sac Aurore porté"),
        ],
        "variants": [("Unique", "Rouge", 4), ("Unique", "Cognac", 2)],
    },
    {
        "slug": "sac-structure-onyx",
        "name": "Sac Structuré Onyx",
        "brand": "Maison Devereux",
        "product_type": "bags",
        "price_eur": Decimal("590"),
        "compare_price_eur": None,
        "is_featured": False,
        "deposit_percentage": 70,
        "description": "Silhouette architecturée en cuir noir mat, fermoir sculpté et chaîne amovible.",
        "images": [
            ("photo-1705909237050-7a7625b47fac", "Sac Structuré Onyx, vue de face"),
            ("photo-1590739225287-bd31519780c3", "Sac Structuré Onyx sur fond clair"),
            ("photo-1559563458-527698bf5295", "Sac Structuré Onyx, détail bandoulière"),
        ],
        "variants": [("Unique", "Noir", 5)],
    },
    {
        "slug": "sneakers-aerial",
        "name": "Sneakers Aerial",
        "brand": "Lucien Rey",
        "product_type": "shoes",
        "price_eur": Decimal("320"),
        "compare_price_eur": None,
        "is_featured": True,
        "deposit_percentage": 50,
        "description": "Tige en cuir nappa et empiècements colorblock, semelle épaisse en caoutchouc premium.",
        "images": [
            ("photo-1560769629-975ec94e6a86", "Sneakers Aerial, vue de trois-quarts"),
            ("photo-1575176647993-a8a6f538e940", "Sneakers Aerial avec boîte"),
            ("photo-1686783695684-7b8351fdebbd", "Sneakers Aerial posées au sol"),
        ],
        "variants": [(size, "Multicolore", (i * 2) % 6) for i, size in enumerate(
            ["38", "39", "40", "41", "42", "43", "44", "45"]
        )],
    },
    {
        "slug": "high-top-nova",
        "name": "High-Top Nova",
        "brand": "Lucien Rey",
        "product_type": "shoes",
        "price_eur": Decimal("280"),
        "compare_price_eur": Decimal("320"),
        "is_featured": False,
        "deposit_percentage": 50,
        "description": "Montante en cuir noir et blanc, laçage renforcé et logo brodé ton sur ton.",
        "images": [
            ("photo-1628413993904-94ecb60f1239", "High-Top Nova, vue de profil"),
            ("photo-1618677831708-0e7fda3148b4", "High-Top Nova, vue de dessus"),
            ("photo-1589089956163-bb7a3eae3dbc", "High-Top Nova en boîte"),
        ],
        "variants": [(size, "Noir/Blanc", (i * 3) % 5) for i, size in enumerate(
            ["39", "40", "41", "42", "43", "44", "45"]
        )],
    },
    {
        "slug": "chronographe-meridien",
        "name": "Chronographe Méridien",
        "brand": "Verrier & Fils",
        "product_type": "watches",
        "price_eur": Decimal("4200"),
        "compare_price_eur": None,
        "is_featured": True,
        "deposit_percentage": 70,
        "description": "Boîtier acier 41mm, mouvement automatique, lunette graduée. Étanche 100m, garantie 2 ans.",
        "images": [
            ("photo-1600003014755-ba31aa59c4b6", "Chronographe Méridien, cadran argenté"),
            ("photo-1587925358603-c2eea5305bbc", "Chronographe Méridien, vue rapprochée"),
            ("photo-1524805444758-089113d48a6d", "Chronographe Méridien sur bracelet cuir"),
        ],
        "variants": [("Unique", "Argent", 2)],
    },
    {
        "slug": "montre-solstice-or",
        "name": "Montre Solstice Or",
        "brand": "Verrier & Fils",
        "product_type": "watches",
        "price_eur": Decimal("6800"),
        "compare_price_eur": None,
        "is_featured": False,
        "deposit_percentage": 70,
        "description": "Boîtier plaqué or 18 carats, cadran soleillé et bracelet cuir cousu main.",
        "images": [
            ("photo-1587925358603-c2eea5305bbc", "Montre Solstice Or, cadran doré"),
            ("photo-1670177257750-9b47927f68eb", "Montre Solstice Or posée"),
        ],
        "variants": [("Unique", "Or", 1)],
    },
    {
        "slug": "blazer-structure-nuit",
        "name": "Blazer Structuré Nuit",
        "brand": "Atelier Corbin",
        "product_type": "clothing",
        "price_eur": Decimal("540"),
        "compare_price_eur": None,
        "is_featured": False,
        "deposit_percentage": 50,
        "description": "Blazer cintré en laine mélangée, épaulettes structurées et doublure satinée.",
        "images": [
            ("photo-1613915617430-8ab0fd7c6baf", "Blazer Structuré Nuit, vue de face"),
            ("photo-1629511565591-a1d494ad6c58", "Blazer Structuré Nuit porté assis"),
            ("photo-1668952135120-7d997b1b3778", "Blazer Structuré Nuit, silhouette longue"),
        ],
        "variants": [(size, "Noir", (i * 2) % 4) for i, size in enumerate(["XS", "S", "M", "L", "XL"])],
    },
    {
        "slug": "robe-soir-onyx",
        "name": "Robe du Soir Onyx",
        "brand": "Atelier Corbin",
        "product_type": "clothing",
        "price_eur": Decimal("460"),
        "compare_price_eur": Decimal("520"),
        "is_featured": True,
        "deposit_percentage": 50,
        "description": "Robe longue en crêpe fluide, dos nu et fente latérale. Doublure intégrale, sur-mesure.",
        "images": [
            ("photo-1663220274232-740f07723310", "Robe du Soir Onyx, vue de face"),
            ("photo-1763750784315-e35f75ef1f2a", "Robe du Soir Onyx en extérieur"),
            ("photo-1662532577856-e8ee8b138a8b", "Robe du Soir Onyx, détail tissu"),
        ],
        "variants": [(size, "Noir", (i * 3) % 5) for i, size in enumerate(["XS", "S", "M", "L"])],
    },
    {
        "slug": "parfum-ambre-imperial",
        "name": "Ambre Impérial — Eau de Parfum 100ml",
        "brand": "Maison Devereux",
        "product_type": "perfumes",
        "price_eur": Decimal("145"),
        "compare_price_eur": None,
        "is_featured": True,
        "deposit_percentage": 50,
        "description": "Notes de tête d'agrumes, cœur ambré-boisé et fond de vanille bourbon. Flacon numéroté.",
        "images": [
            ("photo-1585218334450-afcf929da36e", "Flacon Ambre Impérial, noir et or"),
            ("photo-1588405748880-12d1d2a59f75", "Flacon Ambre Impérial sur textile"),
            ("photo-1608721279136-cd41b752fa41", "Flacon Ambre Impérial, lumière rosée"),
        ],
        "variants": [("100ml", "Ambre", 8)],
    },
    {
        "slug": "parfum-velours-noir",
        "name": "Velours Noir — Eau de Parfum 50ml",
        "brand": "Lucien Rey",
        "product_type": "perfumes",
        "price_eur": Decimal("88"),
        "compare_price_eur": None,
        "is_featured": False,
        "deposit_percentage": 50,
        "description": "Composition boisée-épicée à la cardamome et à l'oud. Sillage profond, longue tenue.",
        "images": [
            ("photo-1615160460366-2c9a41771b51", "Flacon Velours Noir, fond bleu"),
            ("photo-1608721279136-cd41b752fa41", "Flacon Velours Noir, lumière rosée"),
        ],
        "variants": [("50ml", "Noir", 6)],
    },
]


class Command(BaseCommand):
    help = "Peuple le catalogue (catégories, produits, variantes, photos) avec un jeu de données de démonstration."

    def add_arguments(self, parser):
        parser.add_argument(
            "--skip-images",
            action="store_true",
            help="Ne télécharge pas les photos (plus rapide, utile hors-ligne).",
        )

    def handle(self, *args, **options):
        rate = Decimal(str(settings.EUR_XAF_RATE))
        categories = {}
        for cat in CATEGORIES:
            obj, _ = Category.objects.get_or_create(slug=cat["slug"], defaults={"name": cat["name"]})
            categories[cat["slug"]] = obj
        self.stdout.write(self.style.SUCCESS(f"{len(categories)} catégorie(s) prête(s)."))

        created_count = 0
        with transaction.atomic():
            for data in PRODUCTS:
                base_price_xaf = (data["price_eur"] * rate).quantize(Decimal("1"))
                compare_price_xaf = (
                    (data["compare_price_eur"] * rate).quantize(Decimal("1"))
                    if data["compare_price_eur"]
                    else None
                )
                product, created = Product.objects.update_or_create(
                    slug=data["slug"],
                    defaults={
                        "category": categories[data["product_type"]],
                        "product_type": data["product_type"],
                        "name": data["name"],
                        "brand": data["brand"],
                        "description": data["description"],
                        "base_price_xaf": base_price_xaf,
                        "compare_at_price_xaf": compare_price_xaf,
                        "is_active": True,
                        "is_featured": data["is_featured"],
                        "default_deposit_percentage": data["deposit_percentage"],
                    },
                )
                if created:
                    created_count += 1

                if not options["skip_images"] and not product.images.exists():
                    for position, (photo_id, alt) in enumerate(data["images"]):
                        self._attach_image(product, photo_id, alt, position)

                if not product.variants.exists():
                    for size, color, stock in data["variants"]:
                        sku = f"{data['slug'].upper()}-{size.replace(' ', '')}-{color[:3].upper()}"
                        ProductVariant.objects.get_or_create(
                            product=product,
                            size=size,
                            color=color,
                            defaults={"sku": sku, "stock_quantity": stock},
                        )

        self.stdout.write(self.style.SUCCESS(f"{len(PRODUCTS)} produit(s) synchronisé(s), {created_count} créé(s)."))

        # Rattache tout produit sans vendeur (ce jeu de données de démo, ou une
        # fiche créée avant l'introduction du role vendeur) au compte
        # admin/vendeur principal. Tourne après le bootstrap du superuser dans
        # le build Render (voir render.yaml) : ce compte existe donc déjà à ce
        # stade, sauf si les variables DJANGO_SUPERUSER_* n'ont jamais été
        # renseignées — dans ce cas on l'indique clairement plutôt que de
        # planter le déploiement.
        admin_user = User.objects.filter(role=UserRole.ADMIN).order_by("date_joined").first()
        if admin_user is None:
            self.stdout.write(
                self.style.WARNING(
                    "Aucun compte admin trouvé : les produits sans vendeur restent non attribués."
                )
            )
        else:
            orphaned = Product.objects.filter(vendor__isnull=True)
            orphaned_count = orphaned.count()
            if orphaned_count:
                orphaned.update(vendor=admin_user)
                self.stdout.write(
                    self.style.SUCCESS(f"{orphaned_count} produit(s) rattaché(s) au vendeur {admin_user.email}.")
                )

    def _attach_image(self, product, photo_id, alt, position):
        url = unsplash(photo_id)
        try:
            response = requests.get(url, timeout=15)
            response.raise_for_status()
        except requests.RequestException as exc:
            self.stderr.write(self.style.WARNING(f"Échec téléchargement {url} pour {product.slug}: {exc}"))
            return
        # `image.image.save()` ne se contente pas d'écrire un enregistrement :
        # il déclenche l'upload réel vers Cloudinary (MEDIA_STORAGE_BACKEND).
        # Des identifiants Cloudinary absents/invalides sur Render lèvent ici
        # une exception qui, non interceptée, remontait jusqu'au build entier
        # (cette méthode est appelée dans le transaction.atomic() du seeding)
        # et faisait échouer tout le déploiement pour un simple problème
        # d'image — jamais une raison de bloquer la création des produits.
        try:
            image = ProductImage(product=product, position=position)
            image.image.save(f"{product.slug}-{position}.jpg", ContentFile(response.content), save=False)
            image.save()
        except Exception as exc:  # noqa: BLE001 - dépend de la lib Cloudinary, pas d'un type précis
            self.stderr.write(self.style.WARNING(f"Échec upload image pour {product.slug}: {exc}"))
