"""
Pytest configuration and shared fixtures for all tests
"""

import pytest
from typing import Generator
from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, Session
from sqlalchemy.pool import StaticPool

from app.main import app
from app.core.database import Base, get_db
from app.models import User, UserRole, AuthProvider, BlogPost, Product, Event, EventType, StripeOrder, OrderStatus
from datetime import datetime, timedelta
from passlib.context import CryptContext

# Use in-memory SQLite for tests
SQLALCHEMY_DATABASE_URL = "sqlite:///:memory:"

engine = create_engine(
    SQLALCHEMY_DATABASE_URL,
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


@pytest.fixture(scope="function")
def db() -> Generator[Session, None, None]:
    """Create a fresh database for each test"""
    Base.metadata.create_all(bind=engine)
    db = TestingSessionLocal()
    try:
        yield db
    finally:
        db.close()
        Base.metadata.drop_all(bind=engine)


@pytest.fixture(scope="function")
def client(db: Session) -> Generator[TestClient, None, None]:
    """Create a test client with database override"""

    def override_get_db():
        try:
            yield db
        finally:
            pass

    app.dependency_overrides[get_db] = override_get_db
    with TestClient(app) as test_client:
        yield test_client
    app.dependency_overrides.clear()


# User fixtures
@pytest.fixture
def admin_user(db: Session) -> User:
    """Create an admin user"""
    user = User(
        email="admin@test.com",
        hashed_password=pwd_context.hash("testpass123"),
        full_name="Admin User",
        role=UserRole.ADMIN,
        provider=AuthProvider.CREDENTIALS,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def parent_user(db: Session) -> User:
    """Create a parent user"""
    user = User(
        email="parent@test.com",
        hashed_password=pwd_context.hash("testpass123"),
        full_name="Parent User",
        role=UserRole.PARENT,
        provider=AuthProvider.CREDENTIALS,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def player_user(db: Session) -> User:
    """Create a player user"""
    user = User(
        email="player@test.com",
        hashed_password=pwd_context.hash("testpass123"),
        full_name="Player User",
        role=UserRole.PLAYER,
        provider=AuthProvider.CREDENTIALS,
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


@pytest.fixture
def oauth_user(db: Session) -> User:
    """Create an OAuth user"""
    user = User(
        email="oauth@test.com",
        hashed_password=None,
        full_name="OAuth User",
        role=UserRole.PARENT,
        provider=AuthProvider.GOOGLE,
        provider_id="google_test_123",
    )
    db.add(user)
    db.commit()
    db.refresh(user)
    return user


# Blog post fixtures
@pytest.fixture
def sample_blog_post(db: Session) -> BlogPost:
    """Create a sample blog post"""
    post = BlogPost(
        title="Test Blog Post",
        content="This is test content for the blog post.",
        excerpt="Test excerpt",
        image_url="https://example.com/image.jpg",
        author="Test Author",
        published_date=datetime.now(),
    )
    db.add(post)
    db.commit()
    db.refresh(post)
    return post


@pytest.fixture
def multiple_blog_posts(db: Session) -> list[BlogPost]:
    """Create multiple blog posts"""
    posts = []
    for i in range(5):
        post = BlogPost(
            title=f"Test Post {i+1}",
            content=f"Content for post {i+1}",
            excerpt=f"Excerpt {i+1}",
            image_url=f"https://example.com/image{i+1}.jpg",
            author="Test Author",
            published_date=datetime.now() - timedelta(days=i),
        )
        db.add(post)
        posts.append(post)
    db.commit()
    return posts


# Product fixtures
@pytest.fixture
def sample_product(db: Session) -> Product:
    """Create a sample product"""
    product = Product(
        name="Test Jersey",
        description="Test product description",
        price=49.99,
        image_url="https://example.com/jersey.jpg",
        stock_quantity=50,
        category="Jersey",
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


@pytest.fixture
def multiple_products(db: Session) -> list[Product]:
    """Create multiple products"""
    products = []
    categories = ["Jersey", "T-Shirt", "Accessories"]
    for i in range(6):
        product = Product(
            name=f"Test Product {i+1}",
            description=f"Description {i+1}",
            price=29.99 + (i * 10),
            image_url=f"https://example.com/product{i+1}.jpg",
            stock_quantity=100 - (i * 10),
            category=categories[i % 3],
            is_active=True,
        )
        db.add(product)
        products.append(product)
    db.commit()
    return products


@pytest.fixture
def out_of_stock_product(db: Session) -> Product:
    """Create an out of stock product"""
    product = Product(
        name="Out of Stock Item",
        description="This item is out of stock",
        price=39.99,
        image_url="https://example.com/oos.jpg",
        stock_quantity=0,
        category="T-Shirt",
        is_active=True,
    )
    db.add(product)
    db.commit()
    db.refresh(product)
    return product


# Event fixtures
@pytest.fixture
def sample_event(db: Session) -> Event:
    """Create a sample event"""
    event = Event(
        title="Test Open Gym",
        description="Test event description",
        event_type=EventType.OPEN_GYM,
        start_time=datetime.now() + timedelta(days=7),
        end_time=datetime.now() + timedelta(days=7, hours=2),
        location="Test Location",
        is_public=True,
        max_participants=30,
    )
    db.add(event)
    db.commit()
    db.refresh(event)
    return event


@pytest.fixture
def multiple_events(db: Session) -> list[Event]:
    """Create multiple events"""
    events = []
    event_types = [EventType.OPEN_GYM, EventType.TRYOUT, EventType.GAME, EventType.PRACTICE]
    for i in range(4):
        event = Event(
            title=f"Test Event {i+1}",
            description=f"Description {i+1}",
            event_type=event_types[i],
            start_time=datetime.now() + timedelta(days=i+1),
            end_time=datetime.now() + timedelta(days=i+1, hours=2),
            location="Test Location",
            is_public=(i % 2 == 0),
            max_participants=30 if i % 2 == 0 else None,
        )
        db.add(event)
        events.append(event)
    db.commit()
    return events


# Order fixtures
@pytest.fixture
def sample_order(db: Session) -> StripeOrder:
    """Create a sample order"""
    order = StripeOrder(
        session_id="cs_test_123456",
        status=OrderStatus.PENDING,
        amount_total=49.99,
        currency="usd",
        customer_email="test@example.com",
        payment_intent="pi_test_123",
        metadata='{"product_id": 1, "quantity": 1}',
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


@pytest.fixture
def completed_order(db: Session) -> StripeOrder:
    """Create a completed order"""
    order = StripeOrder(
        session_id="cs_test_completed",
        status=OrderStatus.COMPLETED,
        amount_total=99.98,
        currency="usd",
        customer_email="completed@example.com",
        payment_intent="pi_test_completed",
        metadata='{"product_id": 1, "quantity": 2}',
    )
    db.add(order)
    db.commit()
    db.refresh(order)
    return order


# Mock Stripe fixtures
@pytest.fixture
def mock_stripe_session():
    """Mock Stripe checkout session"""
    return {
        "id": "cs_test_mock_session",
        "url": "https://checkout.stripe.com/test",
        "amount_total": 4999,
        "customer_details": {"email": "test@example.com"},
        "payment_intent": "pi_test_mock",
        "metadata": {"product_id": "1", "quantity": "1"},
    }


@pytest.fixture
def mock_stripe_event():
    """Mock Stripe webhook event"""
    return {
        "type": "checkout.session.completed",
        "data": {
            "object": {
                "id": "cs_test_webhook",
                "amount_total": 4999,
                "customer_details": {"email": "webhook@example.com"},
                "payment_intent": "pi_test_webhook",
                "metadata": {"product_id": "1", "quantity": "1"},
            }
        },
    }
