from django.core.management.base import BaseCommand
from django.db import transaction

from apps.orders.models import Order
from apps.payments.models import Transaction
from apps.users.models import User


class Command(BaseCommand):
    help = (
        "Supprime TOUS les comptes utilisateurs qui ne sont ni super-administrateurs ni "
        "membres du staff (is_superuser=False et is_staff=False), avec leurs données "
        "associées (transactions, commandes, demandes de sourcing, paniers). Les comptes "
        "admin/staff sont toujours conservés. "
        "Usage : python manage.py purge_non_admin_users [--dry-run]"
    )

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run", action="store_true", help="Affiche ce qui serait supprimé sans rien supprimer"
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        kept = list(User.objects.filter(is_superuser=True) | User.objects.filter(is_staff=True))
        users = list(User.objects.filter(is_superuser=False, is_staff=False))

        self.stdout.write("Comptes conservés (admin/staff) :")
        for user in kept:
            self.stdout.write(f"  - {user.email}")

        if not users:
            self.stdout.write(self.style.WARNING("Aucun compte non-admin à supprimer."))
            return

        with transaction.atomic():
            for user in users:
                orders = Order.objects.filter(customer=user)
                order_count = orders.count()
                txn_count = Transaction.objects.filter(order__in=orders).count()
                sourcing_count = user.sourcing_requests.count()
                cart_count = user.carts.count()
                self.stdout.write(
                    f"{user.email}: {order_count} commande(s), {txn_count} transaction(s), "
                    f"{sourcing_count} demande(s) de sourcing, {cart_count} panier(s)"
                )

                if dry_run:
                    continue

                # Order.customer et Transaction.order sont en PROTECT : on supprime
                # explicitement transactions puis commandes avant l'utilisateur lui-même.
                Transaction.objects.filter(order__in=orders).delete()
                orders.delete()
                user.delete()  # cascade : sourcing_requests, carts (+ items)

            if dry_run:
                transaction.set_rollback(True)

        if dry_run:
            self.stdout.write(self.style.WARNING(f"Dry-run : {len(users)} compte(s) auraient été supprimés."))
        else:
            self.stdout.write(self.style.SUCCESS(f"Nettoyage réussi : {len(users)} utilisateur(s) supprimé(s)."))
