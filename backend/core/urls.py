from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

from apps.orders import urls as orders_urls
from apps.products import urls as products_urls
from apps.users.views import VendorCashierListCreateView

# Jazzmin lit ses propres réglages depuis JAZZMIN_SETTINGS (core/settings/base.py),
# mais "index_title" (l'intitulé de la page d'accueil de l'admin natif Django)
# n'a pas d'équivalent dans ce dictionnaire : on le pose directement ici.
admin.site.site_header = "Imperial Collection - Administration"
admin.site.site_title = "Imperial Collection - Administration"
admin.site.index_title = "Imperial Collection - Administration"

api_v1_patterns = [
    path("auth/", include("apps.users.urls")),
    path("products/", include("apps.products.urls")),
    path("orders/", include("apps.orders.urls")),
    path("payments/", include("apps.payments.urls")),
    path("promotions/", include("apps.promotions.urls")),
    path("sourcing/", include("apps.sourcing.urls")),
    # Espace vendeur (self-service) : CRUD sur ses propres produits + suivi de
    # préparation de ses propres lignes de commande. Distinct des endpoints
    # ci-dessus (catalogue public / gestion admin globale).
    path("vendor/products/", include(products_urls.vendor_urlpatterns)),
    path("vendor/order-items/", include(orders_urls.vendor_urlpatterns)),
    path("vendor/cashiers/", VendorCashierListCreateView.as_view(), name="vendor-cashiers"),
]

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/", include(api_v1_patterns)),
    path("api/schema/", SpectacularAPIView.as_view(), name="schema"),
    path("api/docs/", SpectacularSwaggerView.as_view(url_name="schema"), name="docs"),
    path("api/redoc/", SpectacularRedocView.as_view(url_name="schema"), name="redoc"),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    # Gunicorn (utilisé même en dev par ce projet) ne sert pas les fichiers
    # statiques comme le fait `runserver` : on les expose donc explicitement,
    # comme pour les médias ci-dessus (STATIC_ROOT est déjà peuplé par
    # `collectstatic`, lancé au démarrage du conteneur web).
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATIC_ROOT)
