from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import include, path
from drf_spectacular.views import (
    SpectacularAPIView,
    SpectacularRedocView,
    SpectacularSwaggerView,
)

api_v1_patterns = [
    path("auth/", include("apps.users.urls")),
    path("products/", include("apps.products.urls")),
    path("orders/", include("apps.orders.urls")),
    path("payments/", include("apps.payments.urls")),
    path("promotions/", include("apps.promotions.urls")),
    path("sourcing/", include("apps.sourcing.urls")),
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
