from django.core.management.base import BaseCommand
from django.db import transaction

from apps.orders.models import Order
from apps.payments.models import Transaction
from apps.users.models import User


class Command(BaseCommand):
    help = (
        "Supprime un ou plusieurs comptes utilisateurs (par e-mail) ainsi que leurs données "
        "associées (transactions, commandes, demandes de sourcing, paniers). "
        "Usage : python manage.py purge_accounts email1 email2 ... [--dry-run]"
    )

    def add_arguments(self, parser):
        parser.add_argument("emails", nargs="+", help="Adresses e-mail des comptes à supprimer")
        parser.add_argument(
            "--dry-run", action="store_true", help="Affiche ce qui serait supprimé sans rien supprimer"
        )

    def handle(self, *args, **options):
        emails = options["emails"]
        dry_run = options["dry_run"]

        users = list(User.objects.filter(email__in=emails))
        found_emails = {u.email for u in users}
        missing = set(emails) - found_emails
        for email in missing:
            self.stdout.write(self.style.WARNING(f"Introuvable, ignoré : {email}"))

        if not users:
            self.stdout.write(self.style.WARNING("Aucun compte à supprimer."))
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
            self.stdout.write(self.style.WARNING("Dry-run : rien n'a été supprimé."))
        else:
            self.stdout.write(self.style.SUCCESS(f"{len(found_emails)} compte(s) supprimé(s) : {', '.join(found_emails)}"))
