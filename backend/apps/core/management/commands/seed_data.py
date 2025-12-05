from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.events.models import Event, EventType
from apps.payments.models import SubscriptionPlan, Product
from apps.core.models import InstagramPost


class Command(BaseCommand):
    help = 'Seed database with sample data for NJ Stars Elite Basketball'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # Create Subscription Plans
        self.create_subscription_plans()

        # Create Events
        self.create_events()

        # Create Products
        self.create_products()

        # Create Instagram Posts
        self.create_instagram_posts()

        self.stdout.write(self.style.SUCCESS('Database seeded successfully!'))

    def create_subscription_plans(self):
        self.stdout.write('Creating subscription plans...')

        plans = [
            {
                'name': 'Monthly Membership',
                'slug': 'monthly',
                'description': 'Flexible month-to-month membership with full access to all programs and facilities.',
                'price': Decimal('175.00'),
                'billing_period': 'monthly',
                'stripe_price_id': 'price_monthly_test',
                'is_active': True,
            },
            {
                'name': 'Seasonal Membership',
                'slug': 'seasonal',
                'description': '3-month seasonal membership - save $50 compared to monthly! Perfect for tournament season.',
                'price': Decimal('475.00'),
                'billing_period': 'seasonal',
                'stripe_price_id': 'price_seasonal_test',
                'is_active': True,
            },
            {
                'name': 'Annual Membership',
                'slug': 'annual',
                'description': 'Full year membership - save $300! Best value for committed players.',
                'price': Decimal('1800.00'),
                'billing_period': 'annual',
                'stripe_price_id': 'price_annual_test',
                'is_active': True,
            },
            {
                'name': 'Team Dues',
                'slug': 'team-dues',
                'description': 'One-time seasonal team dues to secure your spot on the roster. Must be paid by deadline.',
                'price': Decimal('950.00'),
                'billing_period': 'one_time',
                'stripe_price_id': 'price_team_dues_test',
                'is_active': True,
            },
        ]

        for plan_data in plans:
            plan, created = SubscriptionPlan.objects.get_or_create(
                slug=plan_data['slug'],
                defaults=plan_data
            )
            if created:
                self.stdout.write(f'  Created: {plan.name}')
            else:
                self.stdout.write(f'  Exists: {plan.name}')

    def create_events(self):
        self.stdout.write('Creating events...')

        now = timezone.now()

        events = [
            {
                'title': '2025 Spring Tryouts - U14',
                'slug': '2025-spring-tryouts-u14',
                'description': 'Tryouts for our U14 competitive travel team. Players will be evaluated on fundamental skills, basketball IQ, teamwork, and attitude. Bring proper basketball attire and sneakers.',
                'event_type': EventType.TRYOUT,
                'start_datetime': now + timedelta(days=14),
                'end_datetime': now + timedelta(days=14, hours=2),
                'location': 'Bergen County Sports Complex - Court 1',
                'max_participants': 50,
                'registration_deadline': now + timedelta(days=13),
                'requires_payment': True,
                'price': Decimal('25.00'),
                'registration_open': True,
            },
            {
                'title': '2025 Spring Tryouts - U16',
                'slug': '2025-spring-tryouts-u16',
                'description': 'Tryouts for our U16 elite travel team. High-intensity evaluation focused on advanced skills and competitive readiness.',
                'event_type': EventType.TRYOUT,
                'start_datetime': now + timedelta(days=15),
                'end_datetime': now + timedelta(days=15, hours=2),
                'location': 'Bergen County Sports Complex - Court 1',
                'max_participants': 40,
                'registration_deadline': now + timedelta(days=14),
                'requires_payment': True,
                'price': Decimal('25.00'),
                'registration_open': True,
            },
            {
                'title': 'Friday Night Open Gym',
                'slug': 'friday-open-gym-jan-10',
                'description': 'Open gym session for all skill levels. Come work on your game in a supervised, competitive environment. Ages 12-17 welcome.',
                'event_type': EventType.OPEN_GYM,
                'start_datetime': now + timedelta(days=5),
                'end_datetime': now + timedelta(days=5, hours=2),
                'location': 'NJ Stars Practice Facility',
                'max_participants': 30,
                'registration_deadline': now + timedelta(days=4),
                'requires_payment': True,
                'price': Decimal('15.00'),
                'registration_open': True,
            },
            {
                'title': 'Martin Luther King Weekend Tournament',
                'slug': 'mlk-weekend-tournament-2025',
                'description': 'Annual MLK Weekend Tournament featuring top teams from the tri-state area. Multiple age divisions. Championship games on Monday.',
                'event_type': EventType.TOURNAMENT,
                'start_datetime': now + timedelta(days=21),
                'end_datetime': now + timedelta(days=23),
                'location': 'Bergen County Sports Complex - All Courts',
                'max_participants': 200,
                'registration_deadline': now + timedelta(days=14),
                'requires_payment': True,
                'price': Decimal('350.00'),
                'registration_open': True,
            },
            {
                'title': 'Presidents Day Skills Camp',
                'slug': 'presidents-day-camp-2025',
                'description': '3-day intensive skills camp during Presidents Day weekend. Focus on ball handling, shooting mechanics, and defensive fundamentals. Coached by former college players.',
                'event_type': EventType.CAMP,
                'start_datetime': now + timedelta(days=35),
                'end_datetime': now + timedelta(days=37),
                'location': 'NJ Stars Training Center',
                'max_participants': 60,
                'registration_deadline': now + timedelta(days=28),
                'requires_payment': True,
                'price': Decimal('225.00'),
                'registration_open': True,
            },
            {
                'title': 'U14 Team Practice',
                'slug': 'u14-practice-jan-8',
                'description': 'Regular team practice for U14 roster players. Attendance mandatory.',
                'event_type': EventType.PRACTICE,
                'start_datetime': now + timedelta(days=3),
                'end_datetime': now + timedelta(days=3, hours=1.5),
                'location': 'NJ Stars Practice Facility',
                'max_participants': 15,
                'registration_deadline': now + timedelta(days=2),
                'requires_payment': False,
                'price': Decimal('0.00'),
                'registration_open': False,
            },
            {
                'title': 'U16 vs Newark Elite - Scrimmage',
                'slug': 'u16-scrimmage-newark-elite',
                'description': 'Competitive scrimmage against Newark Elite U16 team. Great preparation for upcoming tournament season.',
                'event_type': EventType.GAME,
                'start_datetime': now + timedelta(days=10),
                'end_datetime': now + timedelta(days=10, hours=2),
                'location': 'Newark Sports Arena',
                'max_participants': 20,
                'registration_deadline': now + timedelta(days=9),
                'requires_payment': False,
                'price': Decimal('0.00'),
                'registration_open': False,
            },
        ]

        for event_data in events:
            event, created = Event.objects.get_or_create(
                slug=event_data['slug'],
                defaults=event_data
            )
            if created:
                self.stdout.write(f'  Created: {event.title}')
            else:
                self.stdout.write(f'  Exists: {event.title}')

    def create_products(self):
        self.stdout.write('Creating products...')

        products = [
            {
                'name': 'NJ Stars Practice Jersey - Black',
                'slug': 'practice-jersey-black',
                'description': 'Official NJ Stars Elite practice jersey in black. Moisture-wicking performance fabric with team logo.',
                'price': Decimal('35.00'),
                'category': 'apparel',
                'image_url': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800',
                'is_active': True,
                'stock_quantity': 100,
            },
            {
                'name': 'NJ Stars Practice Jersey - White',
                'slug': 'practice-jersey-white',
                'description': 'Official NJ Stars Elite practice jersey in white. Moisture-wicking performance fabric with team logo.',
                'price': Decimal('35.00'),
                'category': 'apparel',
                'image_url': 'https://images.unsplash.com/photo-1622445275576-721325763afe?w=800',
                'is_active': True,
                'stock_quantity': 100,
            },
            {
                'name': 'NJ Stars Warm-Up Hoodie',
                'slug': 'warmup-hoodie',
                'description': 'Premium warm-up hoodie with embroidered NJ Stars logo. Perfect for pre-game or casual wear.',
                'price': Decimal('55.00'),
                'category': 'apparel',
                'image_url': 'https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800&q=80',
                'is_active': True,
                'stock_quantity': 75,
            },
            {
                'name': 'NJ Stars Shorts - Black',
                'slug': 'shorts-black',
                'description': 'Performance basketball shorts with NJ Stars branding. Lightweight and breathable.',
                'price': Decimal('30.00'),
                'category': 'apparel',
                'image_url': 'https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800',
                'is_active': True,
                'stock_quantity': 120,
            },
            {
                'name': 'NJ Stars Dad Hat',
                'slug': 'dad-hat',
                'description': 'Adjustable dad hat with embroidered NJ Stars logo. Classic fit.',
                'price': Decimal('25.00'),
                'category': 'accessories',
                'image_url': 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800',
                'is_active': True,
                'stock_quantity': 50,
            },
            {
                'name': 'NJ Stars Water Bottle',
                'slug': 'water-bottle',
                'description': '32oz insulated water bottle with NJ Stars Elite graphics. Keeps drinks cold for 24 hours.',
                'price': Decimal('20.00'),
                'category': 'accessories',
                'image_url': 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800',
                'is_active': True,
                'stock_quantity': 60,
            },
            {
                'name': 'NJ Stars Backpack',
                'slug': 'team-backpack',
                'description': 'Spacious team backpack with multiple compartments. Perfect for practice gear and school.',
                'price': Decimal('45.00'),
                'category': 'accessories',
                'image_url': 'https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800',
                'is_active': True,
                'stock_quantity': 40,
            },
        ]

        for product_data in products:
            product, created = Product.objects.get_or_create(
                slug=product_data['slug'],
                defaults=product_data
            )
            if created:
                self.stdout.write(f'  Created: {product.name}')
            else:
                self.stdout.write(f'  Exists: {product.name}')

    def create_instagram_posts(self):
        self.stdout.write('Creating Instagram posts...')

        now = timezone.now()

        posts = [
            {
                'instagram_id': 'njstars_post_001',
                'caption': '🏀 Tryouts are coming! U14 and U16 teams - registration is now open. Elite training awaits our next generation of stars. Link in bio! #NJStarsElite #AAABasketball #BergenCounty',
                'media_type': 'IMAGE',
                'media_url': 'https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800',
                'permalink': 'https://www.instagram.com/p/sample001/',
                'timestamp': now - timedelta(days=2),
            },
            {
                'instagram_id': 'njstars_post_002',
                'caption': '💪 Championship mentality! Our U16 team showing out at the MLK Tournament. Proud of the dedication and hard work these athletes put in every single day. #NJStarsElite #BasketballLife #Champions',
                'media_type': 'IMAGE',
                'media_url': 'https://images.unsplash.com/photo-1504450758481-7338eba7524a?w=800',
                'permalink': 'https://www.instagram.com/p/sample002/',
                'timestamp': now - timedelta(days=5),
            },
            {
                'instagram_id': 'njstars_post_003',
                'caption': '🔥 Game day highlights! Swipe to see the best plays from last nights W. These young athletes are putting in the work and it shows on the court. #GameDay #NJStars #YouthBasketball',
                'media_type': 'CAROUSEL_ALBUM',
                'media_url': 'https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800',
                'permalink': 'https://www.instagram.com/p/sample003/',
                'timestamp': now - timedelta(days=7),
            },
            {
                'instagram_id': 'njstars_post_004',
                'caption': '⭐ Meet Coach Mike - 15 years of experience developing elite basketball talent. Former Division I player bringing professional training to Bergen County. #CoachingStaff #EliteTraining #NJStarsElite',
                'media_type': 'IMAGE',
                'media_url': 'https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=800',
                'permalink': 'https://www.instagram.com/p/sample004/',
                'timestamp': now - timedelta(days=10),
            },
            {
                'instagram_id': 'njstars_post_005',
                'caption': '🎯 Skills development session! Working on ball handling and shooting mechanics. The fundamentals matter - building strong foundations for elite players. #SkillsDevelopment #BasketballTraining #Youth',
                'media_type': 'VIDEO',
                'media_url': 'https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800',
                'permalink': 'https://www.instagram.com/p/sample005/',
                'timestamp': now - timedelta(days=12),
            },
            {
                'instagram_id': 'njstars_post_006',
                'caption': '🏆 Tournament champions! Our U14 squad brought home the hardware this weekend. The future is bright for NJ Stars! Proud coach moment 💙⭐ #Champions #TournamentWin #AAU',
                'media_type': 'IMAGE',
                'media_url': 'https://images.unsplash.com/photo-1607623814075-e51df1bdc82f?w=800',
                'permalink': 'https://www.instagram.com/p/sample006/',
                'timestamp': now - timedelta(days=15),
            },
            {
                'instagram_id': 'njstars_post_007',
                'caption': '📸 Behind the scenes at practice. These athletes show up ready to work every single day. Discipline, dedication, and teamwork - thats the NJ Stars way. #PracticeMakesPerfect #TeamWork #Basketball',
                'media_type': 'CAROUSEL_ALBUM',
                'media_url': 'https://images.unsplash.com/photo-1559692048-79a3f837883d?w=800',
                'permalink': 'https://www.instagram.com/p/sample007/',
                'timestamp': now - timedelta(days=18),
            },
            {
                'instagram_id': 'njstars_post_008',
                'caption': '🔊 Open gym tonight! All skill levels welcome. Come work on your game in a competitive environment. 6-8 PM at our facility. See you on the court! 🏀 #OpenGym #BasketballCommunity #BergenCounty',
                'media_type': 'IMAGE',
                'media_url': 'https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800',
                'permalink': 'https://www.instagram.com/p/sample008/',
                'timestamp': now - timedelta(days=20),
            },
            {
                'instagram_id': 'njstars_post_009',
                'caption': '💯 New merch alert! Official NJ Stars gear now available. Rep your team in style. Link in bio to shop! #TeamMerch #NJStars #BasketballApparel',
                'media_type': 'IMAGE',
                'media_url': 'https://images.unsplash.com/photo-1556906781-9a412961c28c?w=800',
                'permalink': 'https://www.instagram.com/p/sample009/',
                'timestamp': now - timedelta(days=23),
            },
            {
                'instagram_id': 'njstars_post_010',
                'caption': '🌟 Spring season registration is OPEN! Dont miss your chance to be part of something special. Elite coaching, competitive games, and a family atmosphere. Sign up today! #SpringBasketball #Registration #NJStarsElite',
                'media_type': 'IMAGE',
                'media_url': 'https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800',
                'permalink': 'https://www.instagram.com/p/sample010/',
                'timestamp': now - timedelta(days=25),
            },
        ]

        for post_data in posts:
            post, created = InstagramPost.objects.get_or_create(
                instagram_id=post_data['instagram_id'],
                defaults=post_data
            )
            if created:
                self.stdout.write(f'  Created: {post.instagram_id}')
            else:
                self.stdout.write(f'  Exists: {post.instagram_id}')
