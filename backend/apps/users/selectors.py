from .models import User, UserRole


def get_user_by_id(user_id) -> User | None:
    return User.objects.filter(id=user_id).first()


def list_customers():
    return User.objects.filter(role=UserRole.CUSTOMER).order_by("-date_joined")
