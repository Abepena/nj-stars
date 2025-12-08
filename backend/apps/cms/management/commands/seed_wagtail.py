"""
Seed Wagtail CMS with sample content.

This command creates:
- HomePage as the site root
- BlogIndexPage with sample blog posts
- TeamPage with sample player profiles

Usage:
    python manage.py seed_wagtail
"""

from django.core.management.base import BaseCommand
from django.contrib.auth import get_user_model
from django.utils import timezone
from datetime import timedelta

from wagtail.models import Page, Site

from apps.cms.models import (
    HomePage,
    BlogIndexPage,
    BlogPage,
    TeamPage,
    PlayerProfile,
)

User = get_user_model()


class Command(BaseCommand):
    help = "Seed Wagtail CMS with sample content for NJ Stars Elite"

    def handle(self, *args, **options):
        self.stdout.write("Seeding Wagtail CMS...")

        # Get or create admin user for blog authorship
        admin_user = User.objects.filter(is_superuser=True).first()
        if not admin_user:
            self.stdout.write(self.style.WARNING("No superuser found. Blog posts will have no author."))

        # Get the root page
        root = Page.objects.get(depth=1)

        # Delete existing welcome page and any old content (returns refreshed root)
        root = self._cleanup_existing_pages(root)

        # Create HomePage
        homepage = self._create_homepage(root)

        # Update site to use our HomePage as root
        self._update_site(homepage)

        # Create BlogIndexPage and sample posts
        self._create_blog_section(homepage, admin_user)

        # Create TeamPage with players
        self._create_team_section(homepage)

        self.stdout.write(self.style.SUCCESS("✅ Wagtail CMS seeded successfully!"))
        self.stdout.write("")
        self.stdout.write("Pages created:")
        self.stdout.write("  - HomePage (root)")
        self.stdout.write("  - BlogIndexPage ('The Huddle')")
        self.stdout.write("  - 3 sample BlogPages")
        self.stdout.write("  - TeamPage ('Our Team')")
        self.stdout.write("  - 5 sample PlayerProfiles")
        self.stdout.write("")
        self.stdout.write("Test the API:")
        self.stdout.write("  curl http://localhost:8000/api/v2/pages/")
        self.stdout.write("  curl 'http://localhost:8000/api/v2/pages/?type=cms.HomePage&fields=*'")

    def _cleanup_existing_pages(self, root):
        """Remove default Wagtail welcome page and any existing CMS pages."""
        # Delete all children of root (welcome page, any old pages)
        for page in root.get_children():
            self.stdout.write(f"  Deleting: {page.title}")
            # Use specific=True to get the actual page instance
            specific_page = page.specific
            # Unpublish first if published
            if specific_page.live:
                specific_page.unpublish()
                self.stdout.write(f"Unpublished: \"{page.title}\" pk={page.pk}")
            # Delete the page
            page.delete()
            self.stdout.write(f"Page deleted: \"{page.title}\" id={page.id}")

        # Fix tree consistency after deletions
        from wagtail.models import Page
        Page.fix_tree()

        # Refresh the root from database to get updated tree state
        return Page.objects.get(depth=1)

    def _create_homepage(self, root):
        """Create the main HomePage."""
        self.stdout.write("Creating HomePage...")

        homepage = HomePage(
            title="NJ Stars Elite Basketball",
            slug="home",
            hero_heading="Elite Training.",
            hero_tagline="Built for Rising Stars.",
            hero_subheading="Focused training and real competition for players serious about their game.",
            cta_label="Register for Tryouts",
            cta_url="",  # Left blank - will link to events page
            show_huddle_section=True,
            huddle_limit=3,
            show_merch_section=True,
            merch_limit=3,
            show_newsletter_signup=True,
            newsletter_heading="Stay in the Game",
            newsletter_subheading="Get the latest news, event updates, and exclusive content delivered to your inbox.",
            body=[
                {
                    "type": "rich_text",
                    "value": "<p>Welcome to NJ Stars Elite, Bergen County's premier AAU basketball program. We develop young athletes through elite training, competitive play, and character development.</p>",
                },
                {
                    "type": "highlight",
                    "value": {
                        "title": "Why Choose NJ Stars?",
                        "text": "Professional coaching, state-of-the-art facilities, and a proven track record of developing college-ready players.",
                    },
                },
            ],
        )
        root.add_child(instance=homepage)
        homepage.save_revision().publish()
        self.stdout.write(self.style.SUCCESS(f"  ✓ Created: {homepage.title}"))
        return homepage

    def _update_site(self, homepage):
        """Update or create the Site to use our HomePage as root."""
        site = Site.objects.first()
        if site:
            site.root_page = homepage
            site.site_name = "NJ Stars Elite"
            site.save()
            self.stdout.write(f"  Updated site root to: {homepage.title}")
        else:
            # Create a new Site if none exists
            Site.objects.create(
                hostname="localhost",
                port=8000,
                root_page=homepage,
                is_default_site=True,
                site_name="NJ Stars Elite",
            )
            self.stdout.write(f"  Created site with root: {homepage.title}")

    def _create_blog_section(self, homepage, admin_user):
        """Create BlogIndexPage and sample blog posts."""
        self.stdout.write("Creating Blog section...")

        # Create BlogIndexPage
        blog_index = BlogIndexPage(
            title="The Huddle",
            slug="news",
            intro="<p>The latest news, updates, and stories from NJ Stars Elite Basketball. Stay connected with our team!</p>",
        )
        homepage.add_child(instance=blog_index)
        blog_index.save_revision().publish()
        self.stdout.write(self.style.SUCCESS(f"  ✓ Created: {blog_index.title}"))

        # Sample blog posts
        now = timezone.now()
        posts = [
            {
                "title": "Spring 2025 Tryouts Announced",
                "slug": "spring-2025-tryouts",
                "date": (now - timedelta(days=2)).date(),
                "category": "tryouts",
                "intro": "Registration is now open for U14 and U16 team tryouts. Don't miss your chance to join the Stars!",
                "body": [
                    {
                        "type": "paragraph",
                        "value": "<p>We're excited to announce tryouts for our Spring 2025 season. We're looking for dedicated athletes who are ready to take their game to the next level.</p>",
                    },
                    {
                        "type": "heading",
                        "value": "Tryout Details",
                    },
                    {
                        "type": "paragraph",
                        "value": "<p><strong>U14 Division:</strong> Saturday, January 18th, 10:00 AM - 12:00 PM<br/><strong>U16 Division:</strong> Saturday, January 18th, 1:00 PM - 3:00 PM<br/><strong>Location:</strong> Bergen County Sports Complex, Court 1</p>",
                    },
                    {
                        "type": "paragraph",
                        "value": "<p>Registration fee: $25 per player. All participants will be evaluated on fundamental skills, basketball IQ, teamwork, and attitude.</p>",
                    },
                ],
            },
            {
                "title": "U16 Team Wins Holiday Tournament",
                "slug": "u16-holiday-tournament-win",
                "date": (now - timedelta(days=7)).date(),
                "category": "tournament",
                "intro": "Our U16 squad brought home the championship trophy from the Holiday Classic tournament!",
                "body": [
                    {
                        "type": "paragraph",
                        "value": "<p>Congratulations to our U16 team on an incredible performance at the Holiday Classic Tournament! The team went 4-0 over the weekend, defeating some of the top programs in the tri-state area.</p>",
                    },
                    {
                        "type": "paragraph",
                        "value": "<p>In the championship game, the Stars pulled off a thrilling 58-54 victory against Newark Elite. Special shoutout to our MVP Marcus Johnson who led the team with 22 points and 8 rebounds.</p>",
                    },
                    {
                        "type": "heading",
                        "value": "What's Next",
                    },
                    {
                        "type": "paragraph",
                        "value": "<p>The team now prepares for the MLK Weekend Tournament in January. Keep supporting our Stars!</p>",
                    },
                ],
            },
            {
                "title": "New Skills Development Program Launching",
                "slug": "skills-development-program",
                "date": (now - timedelta(days=14)).date(),
                "category": "camp",
                "intro": "Introducing our new weekly skills clinics focused on ball handling, shooting mechanics, and defensive fundamentals.",
                "body": [
                    {
                        "type": "paragraph",
                        "value": "<p>We're launching a new Skills Development Program designed to help players of all levels improve their fundamental basketball skills.</p>",
                    },
                    {
                        "type": "heading",
                        "value": "Program Highlights",
                    },
                    {
                        "type": "paragraph",
                        "value": "<p>• <strong>Ball Handling Mastery:</strong> Weekly drills to improve dribbling, control, and court vision<br/>• <strong>Shooting Mechanics:</strong> Form correction and repetition training<br/>• <strong>Defensive Fundamentals:</strong> Footwork, positioning, and team defense concepts</p>",
                    },
                    {
                        "type": "paragraph",
                        "value": "<p>Sessions run every Wednesday from 6-8 PM at our training facility. Open to all skill levels ages 10-17. Cost: $20 per session or $60 for a monthly pass.</p>",
                    },
                ],
            },
        ]

        for post_data in posts:
            post = BlogPage(
                title=post_data["title"],
                slug=post_data["slug"],
                date=post_data["date"],
                category=post_data.get("category", "news"),
                intro=post_data["intro"],
                body=post_data["body"],
                author=admin_user,
            )
            blog_index.add_child(instance=post)
            post.save_revision().publish()
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created: {post.title}"))

    def _create_team_section(self, homepage):
        """Create TeamPage with sample player profiles."""
        self.stdout.write("Creating Team section...")

        # Create TeamPage
        team_page = TeamPage(
            title="Our Team",
            slug="team",
            intro="<p>Meet the talented athletes of NJ Stars Elite. Our players represent the best of Bergen County basketball.</p>",
        )
        homepage.add_child(instance=team_page)
        team_page.save_revision().publish()
        self.stdout.write(self.style.SUCCESS(f"  ✓ Created: {team_page.title}"))

        # Sample players
        players = [
            {
                "name": "Marcus Johnson",
                "position": "PG",
                "number": "3",
                "grade": "10th Grade",
                "height": "5'11\"",
                "bio": "Team captain and floor general. Marcus led the team in assists last season and is known for his court vision and leadership.",
            },
            {
                "name": "Tyler Williams",
                "position": "SG",
                "number": "12",
                "grade": "11th Grade",
                "height": "6'2\"",
                "bio": "Sharpshooter with range. Tyler shot 42% from three-point range last season and is a lockdown defender.",
            },
            {
                "name": "David Chen",
                "position": "SF",
                "number": "24",
                "grade": "10th Grade",
                "height": "6'4\"",
                "bio": "Athletic wing with a versatile game. David can score from anywhere on the court and is an elite rebounder.",
            },
            {
                "name": "James Rodriguez",
                "position": "PF",
                "number": "32",
                "grade": "9th Grade",
                "height": "6'5\"",
                "bio": "Rising star with tremendous upside. James brings energy and intensity on both ends of the floor.",
            },
            {
                "name": "Michael Thompson",
                "position": "C",
                "number": "50",
                "grade": "11th Grade",
                "height": "6'7\"",
                "bio": "Anchor in the paint. Michael averages a double-double and is one of the top shot blockers in the county.",
            },
        ]

        for player_data in players:
            player = PlayerProfile(
                page=team_page,
                name=player_data["name"],
                position=player_data["position"],
                number=player_data["number"],
                grade=player_data["grade"],
                height=player_data["height"],
                bio=player_data["bio"],
            )
            player.save()
            self.stdout.write(self.style.SUCCESS(f"  ✓ Created player: {player.name}"))
