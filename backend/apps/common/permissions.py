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


class ReadOnlyOrVendorOwner(BasePermission):
    """
    Lecture publique inchangée. Écriture réservée à l'admin (tout produit) et
    au vendeur (uniquement ses propres fiches) — le contrôle d'objet
    (has_object_permission) est ce qui empêche un vendeur de modifier la
    fiche d'un autre vendeur ; has_permission ne fait que barrer les rôles
    n'ayant aucun droit d'écriture (client).
    """

    def has_permission(self, request, view):
        if request.method in SAFE_METHODS:
            return True
        return bool(request.user and request.user.is_authenticated and request.user.role in ("admin", "vendor"))

    def has_object_permission(self, request, view, obj):
        if request.method in SAFE_METHODS:
            return True
        if request.user.role == "admin":
            return True
        return obj.vendor_id == request.user.id
