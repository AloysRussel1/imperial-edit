from rest_framework.routers import DefaultRouter

from .views import SourcingRequestViewSet

app_name = "sourcing"

router = DefaultRouter()
router.register("requests", SourcingRequestViewSet, basename="sourcing-request")

urlpatterns = router.urls
