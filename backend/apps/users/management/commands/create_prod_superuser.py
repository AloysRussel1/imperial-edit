import os

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand


class Command(BaseCommand):
    """
    Bootstrap du superutilisateur de production sans accès Shell (plan
    gratuit Render). Lit les identifiants depuis des variables d'environnement
    exclusivement — jamais de valeur par défaut en dur dans le code, pour ne
    pas se retrouver avec un mot de passe admin en clair dans l'historique
    Git. Conçu pour tourner sans risque à chaque déploiement (juste après
    `migrate`) : ignore silencieusement si les variables ne sont pas
    définies, ou si le compte existe déjà.
    """

    help = (
        "Cree le superutilisateur de production a partir de "
        "DJANGO_SUPERUSER_USERNAME / DJANGO_SUPERUSER_EMAIL / "
        "DJANGO_SUPERUSER_PASSWORD (idempotent, sans effet si deja cree)."
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
                    "DJANGO_SUPERUSER_PASSWORD non definies : creation du "
                    "superuser ignoree."
                )
            )
            return

        if User.objects.filter(email__iexact=email).exists() or User.objects.filter(username=username).exists():
            self.stdout.write(self.style.WARNING(f"Un compte existe deja pour {email} / {username} : rien a faire."))
            return

        User.objects.create_superuser(
            username=username,
            email=email,
            password=password,
            first_name=first_name,
            last_name=last_name,
        )
        self.stdout.write(self.style.SUCCESS("Superuser de production cree avec succes."))
