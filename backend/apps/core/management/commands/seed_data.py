from django.core.management.base import BaseCommand
from django.utils import timezone
from datetime import timedelta
from decimal import Decimal
from apps.events.models import Event, EventType
from apps.payments.models import SubscriptionPlan
from apps.core.models import Coach, InstagramPost


class Command(BaseCommand):
    help = 'Seed database with sample data for NJ Stars Elite Basketball'

    def handle(self, *args, **kwargs):
        self.stdout.write('Seeding database...')

        # Create Subscription Plans
        self.create_subscription_plans()

        # Create Events
        self.create_events()

        # Create Coaches
        self.create_coaches()

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

        # NJ Venue coordinates for map display
        # Bergen County Sports Complex: Hackensack, NJ
        # NJ Stars Practice Facility: Paramus, NJ
        # Newark Sports Arena: Newark, NJ

        events = [
            {
                'title': '2025 Spring Tryouts - U14',
                'slug': '2025-spring-tryouts-u14',
                'description': 'Tryouts for our U14 competitive travel team. Players will be evaluated on fundamental skills, basketball IQ, teamwork, and attitude. Bring proper basketball attire and sneakers.',
                'event_type': EventType.TRYOUT,
                'start_datetime': now + timedelta(days=14),
                'end_datetime': now + timedelta(days=14, hours=2),
                'location': 'Bergen County Sports Complex - Court 1',
                'latitude': Decimal('40.917600'),
                'longitude': Decimal('-74.058800'),
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
                'latitude': Decimal('40.917600'),
                'longitude': Decimal('-74.058800'),
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
                'latitude': Decimal('40.944800'),
                'longitude': Decimal('-74.075200'),
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
                'latitude': Decimal('40.917600'),
                'longitude': Decimal('-74.058800'),
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
                'latitude': Decimal('40.889800'),
                'longitude': Decimal('-74.041300'),
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
                'latitude': Decimal('40.944800'),
                'longitude': Decimal('-74.075200'),
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
                'latitude': Decimal('40.735700'),
                'longitude': Decimal('-74.172400'),
                'max_participants': 20,
                'registration_deadline': now + timedelta(days=9),
                'requires_payment': False,
                'price': Decimal('0.00'),
                'registration_open': False,
            },
            {
                'title': 'Ball Handling Masterclass',
                'slug': 'ball-handling-masterclass-jan',
                'description': 'Intensive skills session focusing on ball handling, crossovers, and creating space. Learn elite moves from Coach Tray. All skill levels welcome.',
                'event_type': EventType.SKILLS,
                'start_datetime': now + timedelta(days=7),
                'end_datetime': now + timedelta(days=7, hours=1.5),
                'location': 'NJ Stars Practice Facility',
                'latitude': Decimal('40.944800'),
                'longitude': Decimal('-74.075200'),
                'max_participants': 20,
                'registration_deadline': now + timedelta(days=6),
                'requires_payment': True,
                'price': Decimal('35.00'),
                'registration_open': True,
            },
            {
                'title': 'Shooting Mechanics Clinic',
                'slug': 'shooting-mechanics-clinic-jan',
                'description': 'Break down your shot and rebuild it the right way. Focus on form, footwork, and consistency. Video analysis included.',
                'event_type': EventType.SKILLS,
                'start_datetime': now + timedelta(days=12),
                'end_datetime': now + timedelta(days=12, hours=2),
                'location': 'NJ Stars Practice Facility',
                'latitude': Decimal('40.944800'),
                'longitude': Decimal('-74.075200'),
                'max_participants': 15,
                'registration_deadline': now + timedelta(days=11),
                'requires_payment': True,
                'price': Decimal('40.00'),
                'registration_open': True,
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


    def create_coaches(self):
        self.stdout.write('Creating coaches...')

        placeholder_photo = 'https://placehold.co/320x320?text=Coach'

        # Real coach data from NJ Stars Elite
        coaches = [
            {
                'name': 'Trajan Chapman',
                'display_name': 'Tray',
                'slug': 'trajan-chapman',
                'role': 'head_coach',
                'title': 'Head Coach & Trainer',
                'bio': 'Trajan "Tray" Chapman is the head coach and lead trainer for NJ Stars Elite. With years of experience in player development and competitive coaching, Tray brings an intense focus on fundamentals, basketball IQ, and mental toughness to every session.',
                'photo_url': placeholder_photo,
                'instagram_handle': 'traygotbounce',
                'specialties': 'player development, ball handling, shooting mechanics, defensive fundamentals',
                'is_active': True,
                'order': 1,
            },
            {
                'name': 'Chris Morales',
                'display_name': 'Coach Cee',
                'slug': 'chris-morales',
                'role': 'skills_coach',
                'title': 'Skills Clinic Coach',
                'bio': 'Coach Cee specializes in skills development clinics and individual training. His approach focuses on building confidence through repetition and breaking down complex moves into learnable steps.',
                'photo_url': placeholder_photo,
                'instagram_handle': 'coach.cee',
                'specialties': 'skills clinics, individual training, footwork, finishing',
                'is_active': True,
                'order': 2,
            },
            {
                'name': 'Kenneth Andrade',
                'display_name': 'Coach K',
                'slug': 'kenneth-andrade',
                'role': 'founder',
                'title': 'Founder & Coach',
                'bio': 'Kenneth "Coach K" Andrade is the founder of NJ Stars Elite AAU Basketball. His vision to create an elite youth basketball program in New Jersey has grown into a thriving organization that develops both athletes and young people.',
                'photo_url': placeholder_photo,
                'instagram_handle': 'kenny_164',
                'specialties': 'program development, team strategy, leadership, community building',
                'is_active': True,
                'order': 3,
            },
        ]

        for coach_data in coaches:
            coach, created = Coach.objects.get_or_create(
                slug=coach_data['slug'],
                defaults=coach_data
            )
            if created:
                self.stdout.write(f'  Created: {coach.display_name}')
            else:
                self.stdout.write(f'  Exists: {coach.display_name}')

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
