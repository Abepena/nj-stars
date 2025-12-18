"""
Clean up test data created by seed_test_data.

Usage:
    python manage.py cleanup_test_data
    python manage.py cleanup_test_data --dry-run  # Preview what will be deleted
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model

User = get_user_model()


class Command(BaseCommand):
    help = "Remove test data seeded by seed_test_data command"

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would be deleted without actually deleting",
        )

    def handle(self, *args, **options):
        dry_run = options["dry_run"]

        if dry_run:
            self.stdout.write(self.style.NOTICE("DRY RUN - No data will be deleted\n"))

        self.stdout.write("Cleaning up test data...\n")

        # Import models
        from apps.core.models import ContactSubmission
        from apps.events.models import Event
        from apps.portal.models import Player, DuesAccount, DuesTransaction
        from apps.payments.models import CashPayment

        # 1. Contact Submissions (by test email domain)
        contact_qs = ContactSubmission.objects.filter(email__endswith="@test.seed")
        contact_count = contact_qs.count()
        if not dry_run:
            contact_qs.delete()
        action = "Would delete" if dry_run else "Deleted"
        self.stdout.write("  {} {} contact submissions".format(action, contact_count))

        # 2. Events (by test slug prefix)
        event_qs = Event.objects.filter(slug__startswith="test-seed-")
        event_count = event_qs.count()
        if not dry_run:
            event_qs.delete()
        self.stdout.write("  {} {} events".format(action, event_count))

        # 3. Cash Payments (by test note marker)
        cash_qs = CashPayment.objects.filter(notes__contains="[TEST-SEED]")
        cash_count = cash_qs.count()
        if not dry_run:
            cash_qs.delete()
        self.stdout.write("  {} {} cash payments".format(action, cash_count))

        # 4. Players and their dues accounts (by test last name)
        player_qs = Player.objects.filter(last_name="TestSeed")
        player_count = player_qs.count()

        # Get dues transaction count before deleting
        dues_txn_count = DuesTransaction.objects.filter(account__player__last_name="TestSeed").count()
        dues_account_count = DuesAccount.objects.filter(player__last_name="TestSeed").count()

        if not dry_run:
            # Transactions and accounts will cascade delete with player
            player_qs.delete()

        self.stdout.write("  {} {} players".format(action, player_count))
        self.stdout.write("  {} {} dues accounts".format(action, dues_account_count))
        self.stdout.write("  {} {} dues transactions".format(action, dues_txn_count))

        # 5. Test users (by test email domain)
        user_qs = User.objects.filter(email__endswith="@test.seed")
        user_count = user_qs.count()
        if not dry_run:
            user_qs.delete()
        self.stdout.write("  {} {} test users".format(action, user_count))

        # Summary
        total = contact_count + event_count + cash_count + player_count + user_count
        self.stdout.write("")

        if dry_run:
            self.stdout.write(self.style.WARNING("Would delete {} total records".format(total)))
            self.stdout.write(self.style.NOTICE("Run without --dry-run to actually delete"))
        else:
            self.stdout.write(self.style.SUCCESS("Cleaned up {} test records!".format(total)))
