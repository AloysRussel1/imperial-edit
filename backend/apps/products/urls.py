from rest_framework.routers import DefaultRouter

from .views import CategoryViewSet, ProductViewSet, VendorProductViewSet

app_name = "products"

router = DefaultRouter()
router.register("categories", CategoryViewSet, basename="category")
router.register("", ProductViewSet, basename="product")

urlpatterns = router.urls

# Espace vendeur (self-service, ses propres produits uniquement) : monté à
# part sous /api/vendor/products/ — voir core/urls.py.
vendor_router = DefaultRouter()
vendor_router.register("", VendorProductViewSet, basename="vendor-product")
vendor_urlpatterns = vendor_router.urls
