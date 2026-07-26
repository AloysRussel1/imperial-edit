from rest_framework import viewsets
from rest_framework.decorators import action
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from apps.common.permissions import ReadOnlyOrAdmin, ReadOnlyOrVendorOwner

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
    """

    serializer_class = ProductDetailSerializer
    permission_classes = (IsAuthenticatedOrReadOnly, ReadOnlyOrVendorOwner)
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

    def perform_create(self, serializer):
        user = self.request.user
        # Un vendeur ne peut créer que ses propres fiches (pas de champ vendor
        # exposé en écriture côté client) ; un admin garde le comportement
        # actuel (vendor laissé tel quel, non attribué automatiquement).
        if user.role == "vendor":
            serializer.save(vendor=user)
        else:
            serializer.save()

    @action(detail=False, methods=["get"], permission_classes=(IsAuthenticated,), url_path="my-products")
    def my_products(self, request):
        """
        Catalogue à gérer pour l'utilisateur connecté : ses propres fiches
        pour un vendeur, le catalogue complet pour un admin (qui gère
        l'ensemble de la plateforme, pas seulement un lot de produits qui lui
        serait rattaché) — même distinction que l'espace admin existant vs un
        espace "mes commandes" strictement personnel.
        """
        base = Product.objects.select_related("category", "vendor").prefetch_related("images", "variants")
        if request.user.role == "admin":
            queryset = base
        elif request.user.role == "vendor":
            queryset = base.filter(vendor=request.user)
        else:
            queryset = base.none()
        serializer = self.get_serializer(queryset, many=True)
        return Response(serializer.data)
