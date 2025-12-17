"""
Seed script for test teams, players, parents, and coaches.
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from apps.portal.models import Team, Player, GuardianRelationship, UserProfile
from datetime import date
import random

User = get_user_model()
TEST_PASSWORD = "test123"

COACHES = [
    {"first": "Keith", "last": "Smith", "display": "Coach K", "email": "keith.smith@test.com"},
    {"first": "Tray", "last": "Johnson", "display": "Coach Tray", "email": "tray.johnson@test.com"},
    {"first": "Marcus", "last": "Williams", "display": "Coach Marcus", "email": "marcus.williams@test.com"},
    {"first": "Derek", "last": "Thompson", "display": "Coach Derek", "email": "derek.thompson@test.com"},
    {"first": "Anthony", "last": "Davis", "display": "Coach AD", "email": "anthony.davis@test.com"},
]

TEAMS = [
    ("3rd Grade Stars", "3rd", "marcus.williams@test.com", ["derek.thompson@test.com"]),
    ("4th Grade Stars", "4th", "derek.thompson@test.com", ["marcus.williams@test.com"]),
    ("5th Grade Stars", "5th", "anthony.davis@test.com", ["keith.smith@test.com"]),
    ("6th Grade Stars", "6th", "marcus.williams@test.com", ["anthony.davis@test.com", "derek.thompson@test.com"]),
    ("7th Grade Stars", "7th", "derek.thompson@test.com", ["tray.johnson@test.com"]),
    ("8th Grade Stars", "8th", "tray.johnson@test.com", ["marcus.williams@test.com", "keith.smith@test.com"]),
    ("High School Elite", "hs", "tray.johnson@test.com", ["keith.smith@test.com", "anthony.davis@test.com"]),
]

PLAYER_NAMES = [
    [("Jaylen", "Carter"), ("Marcus", "Brown"), ("Isaiah", "Jackson")],
    [("Darius", "White"), ("Cameron", "Harris"), ("Xavier", "Martin"), ("Tyrell", "Scott")],
    [("Jamal", "Anderson"), ("DeShawn", "Taylor"), ("Malik", "Robinson")],
    [("Andre", "Williams"), ("Trevon", "Davis"), ("Kendrick", "Moore"), ("Jalen", "Thomas")],
    [("Davon", "Clark"), ("Rashad", "Lewis"), ("Terrence", "Walker")],
    [("LeBron", "JamesJr"), ("Zaire", "Wade"), ("Bronny", "Howard"), ("Shareef", "ONeal")],
    [("Emoni", "Bates"), ("Mikey", "Williams"), ("Chet", "Holmgren"), ("Paolo", "Banchero")],
]

PARENT_FIRST_M = ["Michael", "David", "James", "Robert", "William", "Charles", "Thomas", "Chris"]
PARENT_FIRST_F = ["Lisa", "Jennifer", "Michelle", "Sarah", "Jessica", "Angela", "Stephanie", "Nicole"]
POSITIONS = ["PG", "SG", "SF", "PF", "C"]


def get_username(email):
    """Generate username from email"""
    return email.split("@")[0].replace(".", "_")


class Command(BaseCommand):
    help = "Seed test teams, players, parents, and coaches"

    def add_arguments(self, parser):
        parser.add_argument("--delete", action="store_true", help="Delete test data")

    def handle(self, *args, **options):
        if options["delete"]:
            self.delete_test_data()
        else:
            self.create_test_data()

    def delete_test_data(self):
        self.stdout.write("Deleting test data...")
        count = User.objects.filter(email__endswith="@test.com").count()
        User.objects.filter(email__endswith="@test.com").delete()
        self.stdout.write(f"  Deleted {count} test users")
        Team.objects.filter(name__endswith="Stars").delete()
        Team.objects.filter(name="High School Elite").delete()
        self.stdout.write(self.style.SUCCESS("Test data deleted"))

    def create_test_data(self):
        self.stdout.write("Creating test data...")
        
        coach_users = {}
        for coach in COACHES:
            username = get_username(coach["email"])
            user, created = User.objects.get_or_create(
                email=coach["email"],
                defaults={
                    "username": username,
                    "first_name": coach["first"],
                    "last_name": coach["last"],
                    "is_active": True,
                }
            )
            if created:
                user.set_password(TEST_PASSWORD)
                user.save()
                profile, _ = UserProfile.objects.get_or_create(user=user)
                profile.role = "staff"
                profile.save()
                self.stdout.write(f"  Coach: {coach['display']} ({coach['email']})")
            coach_users[coach["email"]] = user
        
        coach_k = coach_users.get("keith.smith@test.com")
        if coach_k:
            coach_k.is_superuser = True
            coach_k.is_staff = True
            coach_k.save()
        
        teams = []
        for team_data, players in zip(TEAMS, PLAYER_NAMES):
            name, grade, head_email, assistant_emails = team_data
            team, created = Team.objects.get_or_create(
                name=name,
                defaults={"grade_level": grade, "head_coach": coach_users.get(head_email), "is_active": True}
            )
            if created:
                for email in assistant_emails:
                    if email in coach_users:
                        team.assistant_coaches.add(coach_users[email])
                self.stdout.write(f"  Team: {name} (Head: {head_email.split('@')[0]})")
            teams.append((team, players))
        
        grade_to_age = {"3rd": 8, "4th": 9, "5th": 10, "6th": 11, "7th": 12, "8th": 13, "hs": 16}
        
        for team, player_names in teams:
            base_age = grade_to_age.get(team.grade_level, 12)
            for i, (first, last) in enumerate(player_names):
                dob = date(date.today().year - base_age, random.randint(1, 12), random.randint(1, 28))
                clean_last = last.replace(" ", "").replace("'", "")
                player_email = f"{first.lower()}.{clean_last.lower()}@test.com"
                
                player, created = Player.objects.get_or_create(
                    first_name=first, last_name=last,
                    defaults={
                        "date_of_birth": dob,
                        "email": player_email,
                        "jersey_number": str(random.randint(1, 35)),
                        "position": POSITIONS[i % len(POSITIONS)],
                        "team_name": team.name,
                        "team": team,
                        "emergency_contact_name": f"Parent of {first}",
                        "emergency_contact_phone": f"555-{random.randint(100,999)}-{random.randint(1000,9999)}",
                        "is_active": True,
                    }
                )
                
                if created:
                    self.stdout.write(f"    Player: {first} {last} ({team.grade_level})")
                    
                    # Create 2 parents
                    for p_idx, names in enumerate([PARENT_FIRST_M, PARENT_FIRST_F]):
                        p_first = names[hash(f"{first}{last}{p_idx}") % len(names)]
                        p_email = f"{p_first.lower()}.{clean_last.lower()}@test.com"
                        p_username = get_username(p_email)
                        
                        # Make username unique by adding suffix if needed
                        if User.objects.filter(username=p_username).exists():
                            p_username = f"{p_username}_{random.randint(100,999)}"
                        
                        parent, p_created = User.objects.get_or_create(
                            email=p_email,
                            defaults={
                                "username": p_username,
                                "first_name": p_first,
                                "last_name": last,
                                "is_active": True,
                            }
                        )
                        if p_created:
                            parent.set_password(TEST_PASSWORD)
                            parent.save()
                            profile, _ = UserProfile.objects.get_or_create(user=parent)
                            profile.role = "parent"
                            profile.save()
                        
                        GuardianRelationship.objects.get_or_create(
                            guardian=parent, player=player,
                            defaults={"relationship": "parent", "is_primary": (p_idx == 0)}
                        )
        
        self.stdout.write("")
        self.stdout.write(self.style.SUCCESS("Test data created!"))
        self.stdout.write(f"  Teams: {Team.objects.count()}")
        self.stdout.write(f"  Players: {Player.objects.count()}")
        self.stdout.write(f"  Test users: {User.objects.filter(email__endswith='@test.com').count()}")
        self.stdout.write("")
        self.stdout.write("Password: test123")
        self.stdout.write("")
        self.stdout.write("Coach accounts:")
        for c in COACHES:
            self.stdout.write(f"  {c['display']}: {c['email']}")
