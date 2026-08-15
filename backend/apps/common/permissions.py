from rest_framework.permissions import BasePermission, SAFE_METHODS


class IsAdminRole(BasePermission):
    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsOwnerOrAdmin(BasePermission):
    def has_object_permission(self, request, view, obj):
        if request.user.role == "admin":
            return True
        owner_id = getattr(obj, "customer_id", None) or getattr(obj, "user_id", None)
        return owner_id == request.user.id


class ReadOnlyOrAdmin(BasePermission):
    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role == "admin")


class IsVendorOrAdmin(BasePermission):
    """Accès aux endpoints /api/vendor/* : rôle vendeur ou admin uniquement."""

    def has_permission(self, request, view):
        return bool(request.user and request.user.is_authenticated and request.user.role in ("vendor", "admin"))


class IsVendorReadOnlyAdminWrite(BasePermission):
    """
    Catalogue produit — boutique de Yaoundé (mono-boutique, plus une place de
    marché multi-vendeurs) : le personnel de caisse (role="vendor") consulte
    le catalogue (stocks, prix) pour encaisser, mais n'a plus le droit de le
    modifier — seule la propriétaire (role="admin") crée/édite/supprime des
    produits. Accès toujours refusé à un rôle "customer" égaré sur cet
    endpoint (contrairement à ReadOnlyOrAdmin, qui laisse lire n'importe qui).
    """

    def has_permission(self, request, view):
        if not (request.user and request.user.is_authenticated and request.user.role in ("vendor", "admin")):
            return False
        if request.method in SAFE_METHODS:
            return True
        return request.user.role == "admin"
