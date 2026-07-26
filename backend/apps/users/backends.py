from django.contrib.auth import get_user_model
from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

User = get_user_model()


class EmailOrUsernameModelBackend(ModelBackend):
    """
    Le champ de connexion accepte indifféremment l'e-mail ou le username.
    Nécessaire car les deux ne coïncident pas toujours : un compte inscrit
    via /auth/register/ a username == email par convention, mais un compte
    créé via create_prod_superuser peut recevoir un username distinct de son
    e-mail (ex. "admin" / "rtonfo@gmail.com") — le ModelBackend par défaut ne
    cherche que sur USERNAME_FIELD ("username"), d'où le 401 en tapant
    l'e-mail pour ce type de compte alors que le username fonctionne.
    """

    def authenticate(self, request, username=None, password=None, **kwargs):
        identifier = username or kwargs.get(User.USERNAME_FIELD)
        if identifier is None or password is None:
            return None

        user = (
            User.objects.filter(Q(username__iexact=identifier) | Q(email__iexact=identifier))
            .order_by("id")
            .first()
        )
        if user is None:
            # Même run de hachage qu'un échec normal, pour ne pas révéler par
            # une différence de timing qu'aucun compte ne correspond.
            User().set_password(password)
            return None

        if user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
