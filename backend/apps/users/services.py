from django.db import transaction

from .models import User, UserRole


@transaction.atomic
def register_customer(*, email: str, password: str, **extra_fields) -> User:
    user = User(username=email, email=email, role=UserRole.CUSTOMER, **extra_fields)
    user.set_password(password)
    user.full_clean(exclude=["username"])
    user.save()
    return user
