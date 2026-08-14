from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import MultiPartParser
from rest_framework.permissions import IsAuthenticated, IsAuthenticatedOrReadOnly
from rest_framework.response import Response

from apps.common.permissions import IsVendorOrAdmin, ReadOnlyOrAdmin

from .models import Category, Product, ProductImage
from .serializers import CategorySerializer, ProductDetailSerializer, ProductImageSerializer, VendorProductWriteSerializer


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

    Vitrine publique + gestion administrateur (accès à tout le catalogue, toutes
    fiches confondues). La gestion self-service d'un vendeur sur ses propres
    produits passe par VendorProductViewSet ci-dessous (/api/vendor/products/),
    pas par ce ViewSet.
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


class VendorProductViewSet(viewsets.ModelViewSet):
    """
    CRUD self-service pour un vendeur sur SES PROPRES produits — un admin y a
    accès à l'ensemble du catalogue (comme partout ailleurs), un vendeur
    uniquement à ce qui lui est rattaché (Product.vendor).
    """

    serializer_class = VendorProductWriteSerializer
    permission_classes = (IsAuthenticated, IsVendorOrAdmin)
    lookup_field = "slug"

    def get_queryset(self):
        base = Product.objects.select_related("category", "vendor").prefetch_related("images", "variants")
        user = self.request.user
        if user.role == "admin":
            return base
        return base.filter(vendor=user)

    def perform_create(self, serializer):
        user = self.request.user
        # Un vendeur ne peut créer que pour lui-même ; un admin peut, en
        # théorie, créer pour un vendeur précis via un futur formulaire admin
        # (non exposé côté vendeur), mais par défaut se l'attribue aussi.
        serializer.save(vendor=user)

    def perform_destroy(self, instance):
        # Suppression réelle bloquée dès qu'une variante a été commandée
        # (OrderItem.variant est en PROTECT) : on désactive plutôt que de
        # risquer un 500 ProtectedError sur un produit avec historique de
        # commandes — cohérent avec "Supprimer/désactiver" demandé, et avec
        # is_active déjà utilisé partout ailleurs comme interrupteur de
        # visibilité produit.
        instance.is_active = False
        instance.save(update_fields=["is_active"])

    @action(detail=True, methods=["post"], parser_classes=[MultiPartParser], url_path="images")
    def upload_image(self, request, slug=None):
        product = self.get_object()
        image_file = request.FILES.get("image")
        if not image_file:
            return Response({"detail": "Aucun fichier 'image' fourni."}, status=status.HTTP_400_BAD_REQUEST)
        position = product.images.count()
        image = ProductImage.objects.create(product=product, image=image_file, position=position)
        return Response(ProductImageSerializer(image).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=["delete"], url_path=r"images/(?P<image_id>[^/.]+)")
    def delete_image(self, request, slug=None, image_id=None):
        product = self.get_object()
        deleted, _ = product.images.filter(id=image_id).delete()
        if not deleted:
            return Response({"detail": "Photo introuvable."}, status=status.HTTP_404_NOT_FOUND)
        return Response(status=status.HTTP_204_NO_CONTENT)
