from rest_framework import viewsets
from rest_framework.permissions import IsAuthenticatedOrReadOnly

from apps.common.permissions import ReadOnlyOrAdmin

from .models import Category, Product
from .serializers import CategorySerializer, ProductDetailSerializer


class CategoryViewSet(viewsets.ModelViewSet):
    queryset = Category.objects.all()
    serializer_class = CategorySerializer
    permission_classes = (ReadOnlyOrAdmin,)
    lookup_field = "slug"


class ProductViewSet(viewsets.ModelViewSet):
    """
    Le catalogue reste de taille modeste (catalogue de démonstration) : la liste et le
    détail renvoient donc la même représentation complète (images, variantes), ce qui
    évite au frontend de devoir composer deux formes de données différentes.

    Un seul opérateur gère toute la plateforme (base de données, configuration,
    catalogue, commandes) via le rôle admin — pas de notion de vendeur distinct
    avec un accès en écriture restreint à son propre lot de produits.
    """

    serializer_class = ProductDetailSerializer
    permission_classes = (IsAuthenticatedOrReadOnly, ReadOnlyOrAdmin)
    lookup_field = "slug"
    filterset_fields = ("product_type", "category__slug", "is_featured")

    def get_queryset(self):
        base = Product.objects.select_related("category", "vendor").prefetch_related("images", "variants")
        user = self.request.user
        if user.is_authenticated and getattr(user, "role", None) == "admin":
            return base
        # Vitrine publique : les fiches inactives (ex. import brut en attente de complétion
        # par l'équipe) restent invisibles tant qu'un admin ne les active pas explicitement.
        return base.filter(is_active=True)
