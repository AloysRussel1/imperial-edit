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
    """

    queryset = Product.objects.select_related("category").prefetch_related("images", "variants")
    serializer_class = ProductDetailSerializer
    permission_classes = (IsAuthenticatedOrReadOnly, ReadOnlyOrAdmin)
    lookup_field = "slug"
    filterset_fields = ("product_type", "category__slug", "is_featured")
