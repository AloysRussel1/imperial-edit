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


class IsCashierReadOnlyStaffWrite(BasePermission):
    """
    Catalogue produit — hiérarchie à 3 niveaux (ADMIN > VENDOR > CASHIER) :
    le personnel de caisse (role="cashier") consulte le catalogue
    (stocks, prix) pour encaisser, mais n'a jamais le droit de le modifier ;
    le vendeur (role="vendor", propriétaire de sa boutique) a le CRUD complet,
    comme l'admin. Accès toujours refusé à un rôle "customer" égaré sur cet
    endpoint (contrairement à ReadOnlyOrAdmin, qui laisse lire n'importe qui).
    """

    def has_permission(self, request, view):
        role = request.user.role if request.user and request.user.is_authenticated else None
        if role not in ("cashier", "vendor", "admin"):
            return False
        if request.method in SAFE_METHODS:
            return True
        return role in ("vendor", "admin")


class IsPosStaff(BasePermission):
    """
    Vente comptoir (`/api/orders/pos/`) : le personnel de caisse (role=
    "cashier") y a un accès dédié — c'est son seul usage quotidien du
    backend — mais le vendeur et l'admin (droits cumulatifs, comme partout
    ailleurs) peuvent eux aussi tenir la caisse.
    """

    def has_permission(self, request, view):
        role = request.user.role if request.user and request.user.is_authenticated else None
        return role in ("cashier", "vendor", "admin")
