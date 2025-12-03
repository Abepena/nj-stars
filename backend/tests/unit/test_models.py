"""
Unit tests for database models
"""

import pytest
from datetime import datetime
from sqlalchemy.orm import Session
from app.models import (
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


@pytest.mark.unit
class TestUserModel:
    """Tests for User model"""

    def test_create_user_with_credentials(self, db: Session):
        """Test creating a user with credentials provider"""
        user = User(
            email="test@example.com",
            hashed_password="hashedpassword123",
            full_name="Test User",
            role=UserRole.PARENT,
            provider=AuthProvider.CREDENTIALS,
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.id is not None
        assert user.email == "test@example.com"
        assert user.full_name == "Test User"
        assert user.role == UserRole.PARENT
        assert user.provider == AuthProvider.CREDENTIALS

    def test_create_user_with_oauth(self, db: Session):
        """Test creating a user with OAuth provider"""
        user = User(
            email="oauth@example.com",
            hashed_password=None,
            full_name="OAuth User",
            role=UserRole.PARENT,
            provider=AuthProvider.GOOGLE,
            provider_id="google_123",
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.id is not None
        assert user.hashed_password is None
        assert user.provider == AuthProvider.GOOGLE
        assert user.provider_id == "google_123"

    def test_user_roles(self, db: Session):
        """Test different user roles"""
        admin = User(
            email="admin@test.com",
            hashed_password="hash",
            role=UserRole.ADMIN,
            provider=AuthProvider.CREDENTIALS,
        )
        parent = User(
            email="parent@test.com",
            hashed_password="hash",
            role=UserRole.PARENT,
            provider=AuthProvider.CREDENTIALS,
        )
        player = User(
            email="player@test.com",
            hashed_password="hash",
            role=UserRole.PLAYER,
            provider=AuthProvider.CREDENTIALS,
        )

        db.add_all([admin, parent, player])
        db.commit()

        assert admin.role == UserRole.ADMIN
        assert parent.role == UserRole.PARENT
        assert player.role == UserRole.PLAYER


@pytest.mark.unit
class TestBlogPostModel:
    """Tests for BlogPost model"""

    def test_create_blog_post(self, db: Session):
        """Test creating a blog post"""
        post = BlogPost(
            title="Test Post",
            content="This is test content",
            excerpt="Test excerpt",
            image_url="https://example.com/image.jpg",
            author="Test Author",
            published_date=datetime.now(),
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        assert post.id is not None
        assert post.title == "Test Post"
        assert post.content == "This is test content"
        assert post.author == "Test Author"
        assert post.created_at is not None
        assert post.updated_at is not None

    def test_blog_post_optional_fields(self, db: Session):
        """Test blog post with optional fields"""
        post = BlogPost(
            title="Minimal Post",
            content="Content",
            published_date=datetime.now(),
        )
        db.add(post)
        db.commit()
        db.refresh(post)

        assert post.excerpt is None
        assert post.image_url is None
        assert post.author is None


@pytest.mark.unit
class TestProductModel:
    """Tests for Product model"""

    def test_create_product(self, db: Session):
        """Test creating a product"""
        product = Product(
            name="Test Jersey",
            description="A test jersey",
            price=59.99,
            image_url="https://example.com/jersey.jpg",
            stock_quantity=50,
            category="Jersey",
            is_active=True,
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        assert product.id is not None
        assert product.name == "Test Jersey"
        assert product.price == 59.99
        assert product.stock_quantity == 50
        assert product.is_active is True

    def test_product_defaults(self, db: Session):
        """Test product default values"""
        product = Product(
            name="Default Product",
            description="Test",
            price=29.99,
        )
        db.add(product)
        db.commit()
        db.refresh(product)

        assert product.stock_quantity == 0
        assert product.is_active is True

    def test_product_categories(self, db: Session):
        """Test different product categories"""
        categories = ["Jersey", "T-Shirt", "Accessories", "Shorts"]
        products = []

        for cat in categories:
            product = Product(
                name=f"{cat} Product",
                description="Test",
                price=29.99,
                category=cat,
            )
            products.append(product)

        db.add_all(products)
        db.commit()

        for i, product in enumerate(products):
            assert product.category == categories[i]


@pytest.mark.unit
class TestEventModel:
    """Tests for Event model"""

    def test_create_event(self, db: Session):
        """Test creating an event"""
        start_time = datetime.now()
        end_time = datetime.now()

        event = Event(
            title="Test Event",
            description="Test description",
            event_type=EventType.OPEN_GYM,
            start_time=start_time,
            end_time=end_time,
            location="Test Location",
            is_public=True,
            max_participants=30,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        assert event.id is not None
        assert event.title == "Test Event"
        assert event.event_type == EventType.OPEN_GYM
        assert event.is_public is True
        assert event.max_participants == 30

    def test_event_types(self, db: Session):
        """Test different event types"""
        event_types = [
            EventType.OPEN_GYM,
            EventType.TRYOUT,
            EventType.GAME,
            EventType.PRACTICE,
            EventType.TOURNAMENT,
        ]

        events = []
        for et in event_types:
            event = Event(
                title=f"{et.value} Event",
                description="Test",
                event_type=et,
                start_time=datetime.now(),
                is_public=True,
            )
            events.append(event)

        db.add_all(events)
        db.commit()

        for i, event in enumerate(events):
            assert event.event_type == event_types[i]

    def test_event_optional_fields(self, db: Session):
        """Test event with optional fields"""
        event = Event(
            title="Minimal Event",
            description="Test",
            event_type=EventType.GAME,
            start_time=datetime.now(),
            is_public=True,
        )
        db.add(event)
        db.commit()
        db.refresh(event)

        assert event.end_time is None
        assert event.location is None
        assert event.max_participants is None


@pytest.mark.unit
class TestStripeOrderModel:
    """Tests for StripeOrder model"""

    def test_create_order(self, db: Session):
        """Test creating an order"""
        order = StripeOrder(
            session_id="cs_test_123",
            status=OrderStatus.PENDING,
            amount_total=49.99,
            currency="usd",
            customer_email="test@example.com",
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        assert order.id is not None
        assert order.session_id == "cs_test_123"
        assert order.status == OrderStatus.PENDING
        assert order.amount_total == 49.99
        assert order.currency == "usd"

    def test_order_statuses(self, db: Session):
        """Test different order statuses"""
        statuses = [
            OrderStatus.PENDING,
            OrderStatus.COMPLETED,
            OrderStatus.FAILED,
            OrderStatus.REFUNDED,
        ]

        orders = []
        for i, status in enumerate(statuses):
            order = StripeOrder(
                session_id=f"cs_test_{i}",
                status=status,
                amount_total=50.00,
                currency="usd",
            )
            orders.append(order)

        db.add_all(orders)
        db.commit()

        for i, order in enumerate(orders):
            assert order.status == statuses[i]

    def test_order_with_user_relationship(self, db: Session, parent_user: User):
        """Test order with user relationship"""
        order = StripeOrder(
            session_id="cs_test_user",
            user_id=parent_user.id,
            status=OrderStatus.COMPLETED,
            amount_total=99.99,
            currency="usd",
            customer_email=parent_user.email,
        )
        db.add(order)
        db.commit()
        db.refresh(order)

        assert order.user_id == parent_user.id
        assert order.user.email == parent_user.email
        assert len(parent_user.orders) == 1
        assert parent_user.orders[0].session_id == "cs_test_user"
