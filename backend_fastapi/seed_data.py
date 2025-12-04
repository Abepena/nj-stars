"""
Seed script to populate the database with mock data for development and testing.

Run this script to add sample:
- Users (admin, parents, players)
- Blog posts
- Products (merch)
- Events (open gyms, tryouts, games)
- Sample orders

Usage:
    python seed_data.py
"""

from datetime import datetime, timedelta
from app.core.database import SessionLocal, engine
from app.models import (
    Base,
    User,
    UserRole,
    AuthProvider,
    BlogPost,
    Product,
    Event,
    EventType,
    StripeOrder,
    OrderStatus,
)
from passlib.context import CryptContext

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def clear_database():
    """Clear all existing data"""
    print("Clearing existing data...")
    db = SessionLocal()
    try:
        db.query(StripeOrder).delete()
        db.query(Product).delete()
        db.query(Event).delete()
        db.query(BlogPost).delete()
        db.query(User).delete()
        db.commit()
        print("✓ Database cleared")
    except Exception as e:
        db.rollback()
        print(f"Error clearing database: {e}")
    finally:
        db.close()


def seed_users():
    """Create sample users"""
    print("\nSeeding users...")
    db = SessionLocal()

    users = [
        User(
            email="admin@njstars.com",
            hashed_password=hash_password("admin123"),
            full_name="John Coach",
            role=UserRole.ADMIN,
            provider=AuthProvider.CREDENTIALS,
        ),
        User(
            email="parent1@example.com",
            hashed_password=hash_password("parent123"),
            full_name="Sarah Johnson",
            role=UserRole.PARENT,
            provider=AuthProvider.CREDENTIALS,
        ),
        User(
            email="parent2@example.com",
            hashed_password=None,
            full_name="Michael Williams",
            role=UserRole.PARENT,
            provider=AuthProvider.GOOGLE,
            provider_id="google_123456",
        ),
        User(
            email="player1@example.com",
            hashed_password=hash_password("player123"),
            full_name="Marcus Thompson",
            role=UserRole.PLAYER,
            provider=AuthProvider.CREDENTIALS,
        ),
        User(
            email="player2@example.com",
            hashed_password=hash_password("player123"),
            full_name="Jordan Davis",
            role=UserRole.PLAYER,
            provider=AuthProvider.CREDENTIALS,
        ),
    ]

    try:
        db.add_all(users)
        db.commit()
        print(f"✓ Created {len(users)} users")
        print("  - admin@njstars.com / admin123 (Admin)")
        print("  - parent1@example.com / parent123 (Parent)")
        print("  - player1@example.com / player123 (Player)")
    except Exception as e:
        db.rollback()
        print(f"Error seeding users: {e}")
    finally:
        db.close()


def seed_blog_posts():
    """Create sample blog posts"""
    print("\nSeeding blog posts...")
    db = SessionLocal()

    posts = [
        BlogPost(
            title="NJ Stars Win Championship Finals!",
            content="In an electrifying finish, the NJ Stars dominated the championship finals with a decisive 78-65 victory. Marcus Thompson led the team with 24 points and 8 rebounds, while Jordan Davis added 18 points. The team's relentless defense and exceptional teamwork proved too much for the opposition. This championship marks the third title for NJ Stars in five years, cementing our reputation as one of the premier AAU programs in New Jersey.",
            excerpt="NJ Stars claim another championship title with dominant performance in the finals.",
            image_url="https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
            author="Coach John",
            published_date=datetime.now() - timedelta(days=2),
        ),
        BlogPost(
            title="Summer Training Camp Registration Open",
            content="We're excited to announce that registration is now open for our annual Summer Training Camp! This intensive 2-week program runs from July 10-21 and focuses on skill development, team building, and competitive play. Players will receive personalized coaching, participate in daily scrimmages, and learn advanced basketball techniques. Early bird pricing available until June 1st. Don't miss this opportunity to elevate your game!",
            excerpt="Join us for two weeks of intensive basketball training this summer.",
            image_url="https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800",
            author="Coach Sarah",
            published_date=datetime.now() - timedelta(days=5),
        ),
        BlogPost(
            title="Player Spotlight: Marcus Thompson",
            content="This month's player spotlight shines on Marcus Thompson, our star point guard. Marcus has been with NJ Stars for three years and has shown tremendous growth both on and off the court. With a 3.8 GPA and multiple college scouts watching, Marcus exemplifies what it means to be a student-athlete. His leadership, work ethic, and basketball IQ make him a role model for younger players in our program.",
            excerpt="Meet Marcus Thompson, our standout point guard making waves on and off the court.",
            image_url="https://images.unsplash.com/photo-1504450874802-0ba2bcd9b5ae?w=800",
            author="Coach John",
            published_date=datetime.now() - timedelta(days=7),
        ),
        BlogPost(
            title="New Practice Facility Partnership",
            content="We're thrilled to announce our new partnership with Premier Sports Complex in Newark! This state-of-the-art facility features 4 full-size courts, professional training equipment, and climate-controlled spaces. All NJ Stars practices will now be held at this location, providing our athletes with the best possible training environment. The facility also includes film rooms for game analysis and a strength and conditioning center.",
            excerpt="NJ Stars partners with Premier Sports Complex for enhanced training facilities.",
            image_url="https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800",
            author="Admin",
            published_date=datetime.now() - timedelta(days=10),
        ),
        BlogPost(
            title="Tournament Success in Philadelphia",
            content="The NJ Stars U16 team had an outstanding showing at the Philadelphia Spring Classic, going 4-1 and finishing in second place. The team showcased exceptional teamwork and resilience, with standout performances from multiple players. Jordan Davis earned All-Tournament honors with averages of 16 points and 6 assists per game. Great job to all our players and families who made the trip!",
            excerpt="U16 team finishes strong at Philadelphia tournament.",
            image_url="https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800",
            author="Coach Sarah",
            published_date=datetime.now() - timedelta(days=14),
        ),
    ]

    try:
        db.add_all(posts)
        db.commit()
        print(f"✓ Created {len(posts)} blog posts")
    except Exception as e:
        db.rollback()
        print(f"Error seeding blog posts: {e}")
    finally:
        db.close()


def seed_products():
    """Create sample products"""
    print("\nSeeding products...")
    db = SessionLocal()

    products = [
        Product(
            name="NJ Stars Game Jersey - Home",
            description="Official NJ Stars home game jersey. Premium moisture-wicking fabric with embroidered team logo. Available in youth and adult sizes.",
            price=59.99,
            image_url="https://images.unsplash.com/photo-1515965885361-f1e0095517ea?w=800",
            stock_quantity=50,
            category="Jersey",
            is_active=True,
        ),
        Product(
            name="NJ Stars Game Jersey - Away",
            description="Official NJ Stars away game jersey. High-performance fabric designed for maximum comfort during intense play.",
            price=59.99,
            image_url="https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=800",
            stock_quantity=45,
            category="Jersey",
            is_active=True,
        ),
        Product(
            name="NJ Stars Practice T-Shirt",
            description="Comfortable cotton-blend practice tee with screen-printed NJ Stars logo. Perfect for training sessions and casual wear.",
            price=24.99,
            image_url="https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=800",
            stock_quantity=100,
            category="T-Shirt",
            is_active=True,
        ),
        Product(
            name="NJ Stars Hoodie",
            description="Warm and comfortable pullover hoodie with embroidered team logo. 80% cotton, 20% polyester blend.",
            price=49.99,
            image_url="https://images.unsplash.com/photo-1556821840-3a63f95609a7?w=800",
            stock_quantity=60,
            category="Apparel",
            is_active=True,
        ),
        Product(
            name="NJ Stars Basketball Shorts",
            description="Professional-grade basketball shorts with moisture-wicking technology and side pockets. Perfect for games and training.",
            price=34.99,
            image_url="https://images.unsplash.com/photo-1591195853828-11db59a44f6b?w=800",
            stock_quantity=75,
            category="Shorts",
            is_active=True,
        ),
        Product(
            name="NJ Stars Snapback Hat",
            description="Classic snapback cap with embroidered NJ Stars logo. Adjustable fit, one size fits most.",
            price=27.99,
            image_url="https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800",
            stock_quantity=80,
            category="Accessories",
            is_active=True,
        ),
        Product(
            name="NJ Stars Water Bottle",
            description="32oz insulated stainless steel water bottle. Keeps drinks cold for 24 hours. Features laser-engraved team logo.",
            price=19.99,
            image_url="https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800",
            stock_quantity=120,
            category="Accessories",
            is_active=True,
        ),
        Product(
            name="NJ Stars Backpack",
            description="Durable sports backpack with multiple compartments, padded laptop sleeve, and water bottle holders. Perfect for school and travel.",
            price=44.99,
            image_url="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=800",
            stock_quantity=40,
            category="Accessories",
            is_active=True,
        ),
        Product(
            name="Limited Edition Championship Tee",
            description="Commemorative t-shirt celebrating NJ Stars championship victory. Limited quantities available!",
            price=29.99,
            image_url="https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=800",
            stock_quantity=8,
            category="T-Shirt",
            is_active=True,
        ),
    ]

    try:
        db.add_all(products)
        db.commit()
        print(f"✓ Created {len(products)} products")
    except Exception as e:
        db.rollback()
        print(f"Error seeding products: {e}")
    finally:
        db.close()


def seed_events():
    """Create sample events"""
    print("\nSeeding events...")
    db = SessionLocal()

    now = datetime.now()

    events = [
        Event(
            title="Open Gym - All Ages",
            description="Open gym session for all skill levels. Come work on your game in a friendly, competitive environment. Coaches will be available for guidance.",
            event_type=EventType.OPEN_GYM,
            start_time=now + timedelta(days=3, hours=18),
            end_time=now + timedelta(days=3, hours=20),
            location="Premier Sports Complex, Newark, NJ",
            is_public=True,
            max_participants=30,
        ),
        Event(
            title="U16 Team Tryouts",
            description="Tryouts for the U16 NJ Stars competitive team. Players should bring water, basketball shoes, and be ready to compete. Registration required.",
            event_type=EventType.TRYOUT,
            start_time=now + timedelta(days=7, hours=9),
            end_time=now + timedelta(days=7, hours=12),
            location="Premier Sports Complex, Newark, NJ",
            is_public=True,
            max_participants=50,
        ),
        Event(
            title="Team Practice - U16",
            description="Weekly team practice for U16 roster. Focus on offensive sets and defensive rotations. Attendance mandatory.",
            event_type=EventType.PRACTICE,
            start_time=now + timedelta(days=5, hours=17),
            end_time=now + timedelta(days=5, hours=19),
            location="Premier Sports Complex, Newark, NJ",
            is_public=False,
            max_participants=None,
        ),
        Event(
            title="Game vs. Jersey Shore Elite",
            description="Home game against Jersey Shore Elite. Come support the team! Game starts at 7 PM.",
            event_type=EventType.GAME,
            start_time=now + timedelta(days=10, hours=19),
            end_time=now + timedelta(days=10, hours=21),
            location="Premier Sports Complex, Newark, NJ",
            is_public=True,
            max_participants=None,
        ),
        Event(
            title="Atlantic City Summer Showcase",
            description="Three-day tournament featuring top AAU teams from the region. Multiple age divisions. Spectators welcome!",
            event_type=EventType.TOURNAMENT,
            start_time=now + timedelta(days=21, hours=8),
            end_time=now + timedelta(days=23, hours=18),
            location="Atlantic City Convention Center, Atlantic City, NJ",
            is_public=True,
            max_participants=None,
        ),
        Event(
            title="Skills Development Workshop",
            description="Special skills clinic focusing on ball handling, shooting mechanics, and footwork. Led by Coach John. Open to all registered players.",
            event_type=EventType.PRACTICE,
            start_time=now + timedelta(days=14, hours=10),
            end_time=now + timedelta(days=14, hours=13),
            location="Premier Sports Complex, Newark, NJ",
            is_public=False,
            max_participants=25,
        ),
        Event(
            title="U14 Team Tryouts",
            description="Competitive tryouts for U14 age division. Bring a positive attitude and your best effort!",
            event_type=EventType.TRYOUT,
            start_time=now + timedelta(days=8, hours=9),
            end_time=now + timedelta(days=8, hours=12),
            location="Premier Sports Complex, Newark, NJ",
            is_public=True,
            max_participants=50,
        ),
        Event(
            title="Open Gym - High School",
            description="Open gym specifically for high school players. Competitive runs, coaches available.",
            event_type=EventType.OPEN_GYM,
            start_time=now + timedelta(days=4, hours=18),
            end_time=now + timedelta(days=4, hours=21),
            location="Premier Sports Complex, Newark, NJ",
            is_public=True,
            max_participants=24,
        ),
    ]

    try:
        db.add_all(events)
        db.commit()
        print(f"✓ Created {len(events)} events")
    except Exception as e:
        db.rollback()
        print(f"Error seeding events: {e}")
    finally:
        db.close()


def seed_orders():
    """Create sample orders"""
    print("\nSeeding sample orders...")
    db = SessionLocal()

    orders = [
        StripeOrder(
            session_id="cs_test_a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6",
            status=OrderStatus.COMPLETED,
            amount_total=59.99,
            currency="usd",
            customer_email="parent1@example.com",
            payment_intent="pi_test_1234567890",
            metadata='{"product_id": 1, "quantity": 1}',
            created_at=datetime.now() - timedelta(days=5),
        ),
        StripeOrder(
            session_id="cs_test_b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7",
            status=OrderStatus.COMPLETED,
            amount_total=74.98,
            currency="usd",
            customer_email="parent2@example.com",
            payment_intent="pi_test_0987654321",
            metadata='{"product_id": 3, "quantity": 3}',
            created_at=datetime.now() - timedelta(days=3),
        ),
        StripeOrder(
            session_id="cs_test_c3d4e5f6g7h8i9j0k1l2m3n4o5p6q7r8",
            status=OrderStatus.COMPLETED,
            amount_total=49.99,
            currency="usd",
            customer_email="player1@example.com",
            payment_intent="pi_test_1122334455",
            metadata='{"product_id": 4, "quantity": 1}',
            created_at=datetime.now() - timedelta(days=1),
        ),
    ]

    try:
        db.add_all(orders)
        db.commit()
        print(f"✓ Created {len(orders)} sample orders")
    except Exception as e:
        db.rollback()
        print(f"Error seeding orders: {e}")
    finally:
        db.close()


def main():
    """Run all seed functions"""
    print("=" * 50)
    print("NJ STARS DATABASE SEEDER")
    print("=" * 50)

    # Create tables if they don't exist
    print("\nEnsuring database tables exist...")
    Base.metadata.create_all(bind=engine)
    print("✓ Tables ready")

    # Clear existing data
    clear_database()

    # Seed data
    seed_users()
    seed_blog_posts()
    seed_products()
    seed_events()
    seed_orders()

    print("\n" + "=" * 50)
    print("✓ DATABASE SEEDING COMPLETE!")
    print("=" * 50)
    print("\nYou can now start the application and see sample data.")
    print("\nTest Accounts:")
    print("  Admin:  admin@njstars.com / admin123")
    print("  Parent: parent1@example.com / parent123")
    print("  Player: player1@example.com / player123")
    print("\n")


if __name__ == "__main__":
    main()
