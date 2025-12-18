"""
Seed test data for development/testing.

Usage:
    python manage.py seed_test_data
    python manage.py seed_test_data --clear  # Clear existing test data first
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal

User = get_user_model()


class Command(BaseCommand):
    help = "Seed test data for dashboard testing"

    def add_arguments(self, parser):
        parser.add_argument(
            "--clear",
            action="store_true",
            help="Clear existing test data before seeding",
        )

    def handle(self, *args, **options):
        if options["clear"]:
            self.clear_test_data()

        self.stdout.write(self.style.NOTICE("Seeding test data..."))

        self.create_contact_submissions()
        self.create_events()
        self.create_players_with_dues()
        self.create_cash_payments()

        self.stdout.write(self.style.SUCCESS("Test data seeded successfully!"))

    def clear_test_data(self):
        from apps.core.models import ContactSubmission
        from apps.events.models import Event
        from apps.portal.models import Player
        from apps.payments.models import CashPayment

        ContactSubmission.objects.filter(email__endswith="@test.seed").delete()
        Event.objects.filter(slug__startswith="test-seed-").delete()
        Player.objects.filter(last_name="TestSeed").delete()
        CashPayment.objects.filter(notes__contains="[TEST-SEED]").delete()
        User.objects.filter(email__endswith="@test.seed").delete()

        self.stdout.write(self.style.WARNING("Cleared existing test data"))

    def create_contact_submissions(self):
        from apps.core.models import ContactSubmission

        submissions = [
            {
                "name": "Sarah Johnson",
                "email": "sarah.johnson@test.seed",
                "phone": "555-0101",
                "category": "registration",
                "subject": "Question about winter tryouts",
                "message": "Hi! My son is 12 years old and interested in trying out for the team. When are the next tryouts scheduled? Also, does he need to bring anything specific?",
                "priority": "normal",
                "status": "new",
            },
            {
                "name": "Michael Chen",
                "email": "michael.chen@test.seed",
                "phone": "555-0102",
                "category": "payments",
                "subject": "Payment not going through",
                "message": "I tried to pay for the holiday camp but my card keeps getting declined. I called my bank and they said there is no issue on their end. Can you help?",
                "priority": "high",
                "status": "new",
            },
            {
                "name": "Lisa Williams",
                "email": "lisa.williams@test.seed",
                "phone": "",
                "category": "portal",
                "subject": "Cannot access my account",
                "message": "I forgot my password and the reset email never arrives. I have checked spam. My email is lisa.williams@test.seed. Please help!",
                "priority": "urgent",
                "status": "new",
            },
            {
                "name": "David Martinez",
                "email": "david.martinez@test.seed",
                "phone": "555-0104",
                "category": "feedback",
                "subject": "Great experience at last camp!",
                "message": "Just wanted to say thank you for the amazing summer camp. My daughter learned so much and the coaches were fantastic. Looking forward to the next one!",
                "priority": "low",
                "status": "new",
            },
            {
                "name": "Jennifer Brown",
                "email": "jennifer.brown@test.seed",
                "phone": "555-0105",
                "category": "general",
                "subject": "Volunteer opportunities",
                "message": "I am a former college basketball player and would love to help out with the team. Are there any volunteer coaching or assistant opportunities available?",
                "priority": "normal",
                "status": "new",
            },
        ]

        created_count = 0
        for data in submissions:
            exists = ContactSubmission.objects.filter(
                email=data["email"],
                subject=data["subject"]
            ).exists()
            if not exists:
                ContactSubmission.objects.create(**data)
                created_count += 1

        self.stdout.write("  Created {} contact submissions".format(created_count))

    def create_events(self):
        from apps.events.models import Event

        now = timezone.now()
        today = now.replace(hour=0, minute=0, second=0, microsecond=0)
        tomorrow = today + timedelta(days=1)

        events = [
            {
                "title": "Skills Training Session",
                "slug": "test-seed-skills-today",
                "description": "Fundamental skills development focusing on ball handling and shooting.",
                "event_type": "skills",
                "start_datetime": today.replace(hour=16, minute=0),
                "end_datetime": today.replace(hour=18, minute=0),
                "location": "Main Gym - Court 1",
                "is_public": True,
                "requires_payment": True,
                "price": Decimal("25.00"),
                "max_participants": 20,
                "registration_open": True,
            },
            {
                "title": "Open Gym - All Ages",
                "slug": "test-seed-open-gym-today",
                "description": "Open court time for all registered players. First come, first served.",
                "event_type": "open_gym",
                "start_datetime": today.replace(hour=18, minute=30),
                "end_datetime": today.replace(hour=20, minute=30),
                "location": "Main Gym - Court 2",
                "is_public": True,
                "requires_payment": False,
                "max_participants": 30,
                "registration_open": True,
            },
            {
                "title": "Elite Team Practice",
                "slug": "test-seed-practice-tomorrow",
                "description": "Scheduled practice for Elite travel team players only.",
                "event_type": "practice",
                "start_datetime": tomorrow.replace(hour=17, minute=0),
                "end_datetime": tomorrow.replace(hour=19, minute=0),
                "location": "Main Gym",
                "is_public": False,
                "requires_payment": False,
                "max_participants": 15,
                "registration_open": False,
            },
            {
                "title": "Youth Clinic (Ages 8-12)",
                "slug": "test-seed-clinic-tomorrow",
                "description": "Introductory basketball clinic for younger players. Focus on fundamentals and fun!",
                "event_type": "camp",
                "start_datetime": tomorrow.replace(hour=10, minute=0),
                "end_datetime": tomorrow.replace(hour=12, minute=0),
                "location": "Community Center Gym",
                "is_public": True,
                "requires_payment": True,
                "price": Decimal("35.00"),
                "max_participants": 25,
                "registration_open": True,
            },
        ]

        created_count = 0
        for data in events:
            if not Event.objects.filter(slug=data["slug"]).exists():
                Event.objects.create(**data)
                created_count += 1

        self.stdout.write("  Created {} events".format(created_count))

    def create_players_with_dues(self):
        from apps.portal.models import Player, UserProfile, DuesAccount, GuardianRelationship

        parent_user, _ = User.objects.get_or_create(
            email="testparent@test.seed",
            defaults={
                "username": "testparent_seed",
                "first_name": "Test",
                "last_name": "Parent",
                "is_active": True,
            }
        )

        UserProfile.objects.get_or_create(
            user=parent_user,
            defaults={"role": "parent"}
        )

        players_data = [
            {
                "first_name": "Tommy",
                "last_name": "TestSeed",
                "date_of_birth": timezone.now().date() - timedelta(days=365 * 12),
                "jersey_number": "23",
                "position": "guard",
                "balance": Decimal("150.00"),
                "charge_description": "Monthly dues - December 2025",
            },
            {
                "first_name": "Emma",
                "last_name": "TestSeed",
                "date_of_birth": timezone.now().date() - timedelta(days=365 * 10),
                "jersey_number": "15",
                "position": "forward",
                "balance": Decimal("75.00"),
                "charge_description": "Tournament fee - Holiday Classic",
            },
            {
                "first_name": "Jake",
                "last_name": "TestSeed",
                "date_of_birth": timezone.now().date() - timedelta(days=365 * 14),
                "jersey_number": "7",
                "position": "center",
                "balance": Decimal("200.00"),
                "charge_description": "Monthly dues - Nov & Dec 2025",
            },
        ]

        created_count = 0
        for pdata in players_data:
            balance = pdata.pop("balance")
            charge_desc = pdata.pop("charge_description")

            player, created = Player.objects.get_or_create(
                first_name=pdata["first_name"],
                last_name=pdata["last_name"],
                defaults={
                    "date_of_birth": pdata["date_of_birth"],
                    "jersey_number": pdata["jersey_number"],
                    "position": pdata["position"],
                    "is_active": True,
                }
            )

            if created:
                # Link player to guardian
                GuardianRelationship.objects.get_or_create(
                    guardian=parent_user,
                    player=player,
                    defaults={
                        "relationship": "parent",
                        "is_primary": True,
                        "can_pickup": True,
                    }
                )

                # Create dues account with balance
                dues_account, _ = DuesAccount.objects.get_or_create(
                    player=player,
                    defaults={"balance": Decimal("0.00"), "is_good_standing": False}
                )
                dues_account.add_charge(balance, charge_desc)
                created_count += 1

        self.stdout.write("  Created {} players with dues".format(created_count))

    def create_cash_payments(self):
        from apps.payments.models import CashPayment
        from apps.portal.models import Player

        staff_user, _ = User.objects.get_or_create(
            email="coach@test.seed",
            defaults={
                "username": "coach_seed",
                "first_name": "Coach",
                "last_name": "Williams",
                "is_staff": True,
                "is_active": True,
            }
        )

        test_players = Player.objects.filter(last_name="TestSeed")

        created_count = 0
        for player in test_players[:2]:
            if hasattr(player, "dues_account"):
                existing = CashPayment.objects.filter(
                    dues_account=player.dues_account,
                    notes__contains="[TEST-SEED]"
                ).exists()

                if not existing:
                    note = "[TEST-SEED] Partial payment for {} from parent".format(player.full_name)
                    CashPayment.objects.create(
                        collected_by=staff_user,
                        payment_for="dues",
                        dues_account=player.dues_account,
                        amount=Decimal("50.00"),
                        status="collected",
                        notes=note,
                    )
                    created_count += 1

        self.stdout.write("  Created {} cash payments".format(created_count))
