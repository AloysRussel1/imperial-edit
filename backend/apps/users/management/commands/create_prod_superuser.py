import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand

from apps.users.models import UserRole


class Command(BaseCommand):
    """
    Bootstrap / réinitialisation forcée du superutilisateur de production
    sans accès Shell (plan gratuit Render). Lit les identifiants depuis des
    variables d'environnement exclusivement — jamais de valeur par défaut en
    dur dans le code, pour ne pas se retrouver avec un mot de passe admin en
    clair dans l'historique Git (et jamais affiché en clair dans les logs de
    build, eux aussi persistés par Render).

    Conçu pour tourner sans risque à chaque déploiement (juste après
    `migrate`) :
    - variables absentes -> ne fait rien.
    - compte déjà existant (par e-mail ou username) -> mot de passe et
      statut admin/staff FORCÉS à jour (c'est un reset explicite, pas juste
      une création) plutôt qu'ignorés, pour pouvoir débloquer un accès admin
      perdu sans connaître l'ancien mot de passe.
    - compte absent -> créé.
    """

    help = (
        "Cree ou reinitialise de force le superutilisateur de production a partir de "
        "DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_EMAIL / DJANGO_SUPERUSER_PASSWORD."
    )

    def handle(self, *args, **options):
        User = get_user_model()

        username = os.environ.get("DJANGO_SUPERUSER_USERNAME")
        email = os.environ.get("DJANGO_SUPERUSER_EMAIL")
        password = os.environ.get("DJANGO_SUPERUSER_PASSWORD")
        first_name = os.environ.get("DJANGO_SUPERUSER_FIRST_NAME", "")
        last_name = os.environ.get("DJANGO_SUPERUSER_LAST_NAME", "")

        if not (username and email and password):
            self.stdout.write(
                self.style.WARNING(
                    "DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_EMAIL / "
                    "DJANGO_SUPERUSER_PASSWORD non definies : creation/reset du "
                    "superuser ignore."
                )
            )
            return

        existing = User.objects.filter(email__iexact=email).first() or User.objects.filter(username=username).first()

        if existing is not None:
            existing.username = username
            existing.email = email
            existing.first_name = first_name or existing.first_name
            existing.last_name = last_name or existing.last_name
            existing.is_active = True
            existing.is_staff = True
            existing.is_superuser = True
            # `create_superuser()`/is_staff ne suffisent qu'a l'admin Django lui-meme :
            # le tableau de bord "Espace vendeur" du frontend verifie le champ
            # metier `role` (defaut "customer"), pas is_staff/is_superuser. Sans ce
            # champ force a ADMIN, ce compte se connecterait a /admin/ mais serait
            # rejete de l'espace vendeur cote frontend.
            existing.role = UserRole.ADMIN
            existing.set_password(password)
            existing.save()
            # Jamais le mot de passe en clair dans les logs (persistes par Render) :
            # seule la confirmation que l'operation a eu lieu est journalisee.
            self.stdout.write(self.style.SUCCESS(f"Superuser {email} reinitialise de force avec succes."))
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
            role=UserRole.ADMIN,
        )
        self.stdout.write(self.style.SUCCESS(f"Superuser {email} cree avec succes."))
