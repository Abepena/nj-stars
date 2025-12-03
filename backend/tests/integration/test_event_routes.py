"""
Integration tests for event API routes
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
from app.models import Event, EventType


@pytest.mark.integration
class TestEventRoutes:
    """Tests for event endpoints"""

    def test_get_events_empty(self, client: TestClient, db: Session):
        """Test getting events when database is empty"""
        response = client.get("/api/v1/events")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_events(self, client: TestClient, multiple_events: list[Event]):
        """Test getting all events"""
        response = client.get("/api/v1/events")

        assert response.status_code == 200
        data = response.json()
        # Only public events should be returned by default
        public_events = [e for e in multiple_events if e.is_public]
        assert len(data) == len(public_events)

    def test_get_events_pagination(self, client: TestClient, multiple_events: list[Event]):
        """Test events pagination"""
        response = client.get("/api/v1/events?skip=0&limit=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 2

    def test_get_events_by_type(self, client: TestClient, multiple_events: list[Event]):
        """Test filtering events by type"""
        response = client.get("/api/v1/events?event_type=open_gym")

        assert response.status_code == 200
        data = response.json()
        assert all(event["event_type"] == "open_gym" for event in data)

    def test_get_upcoming_events_only(self, client: TestClient, db: Session):
        """Test upcoming_only parameter filters past events"""
        # Create a past event
        past_event = Event(
            title="Past Event",
            description="This event has passed",
            event_type=EventType.GAME,
            start_time=datetime.now() - timedelta(days=7),
            is_public=True,
        )
        # Create a future event
        future_event = Event(
            title="Future Event",
            description="This event is upcoming",
            event_type=EventType.GAME,
            start_time=datetime.now() + timedelta(days=7),
            is_public=True,
        )
        db.add_all([past_event, future_event])
        db.commit()

        response = client.get("/api/v1/events?upcoming_only=true")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 1
        assert data[0]["title"] == "Future Event"

    def test_get_all_events_including_past(self, client: TestClient, db: Session):
        """Test getting all events including past ones"""
        past_event = Event(
            title="Past Event",
            description="Test",
            event_type=EventType.GAME,
            start_time=datetime.now() - timedelta(days=7),
            is_public=True,
        )
        future_event = Event(
            title="Future Event",
            description="Test",
            event_type=EventType.GAME,
            start_time=datetime.now() + timedelta(days=7),
            is_public=True,
        )
        db.add_all([past_event, future_event])
        db.commit()

        response = client.get("/api/v1/events?upcoming_only=false")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_events_ordered_by_start_time(self, client: TestClient, multiple_events: list[Event]):
        """Test events are ordered by start time"""
        response = client.get("/api/v1/events")

        assert response.status_code == 200
        data = response.json()

        # Events should be in ascending order by start_time
        if len(data) > 1:
            for i in range(len(data) - 1):
                current_time = datetime.fromisoformat(data[i]["start_time"])
                next_time = datetime.fromisoformat(data[i + 1]["start_time"])
                assert current_time <= next_time

    def test_get_single_event(self, client: TestClient, sample_event: Event):
        """Test getting a single event by ID"""
        response = client.get(f"/api/v1/events/{sample_event.id}")

        assert response.status_code == 200
        data = response.json()
        assert data["id"] == sample_event.id
        assert data["title"] == sample_event.title
        assert data["event_type"] == sample_event.event_type.value

    def test_get_nonexistent_event(self, client: TestClient, db: Session):
        """Test getting an event that doesn't exist"""
        response = client.get("/api/v1/events/9999")

        assert response.status_code == 404
        assert "not found" in response.json()["detail"].lower()

    def test_event_response_structure(self, client: TestClient, sample_event: Event):
        """Test event response has correct structure"""
        response = client.get(f"/api/v1/events/{sample_event.id}")

        assert response.status_code == 200
        data = response.json()

        required_fields = [
            "id",
            "title",
            "description",
            "event_type",
            "start_time",
            "location",
            "max_participants",
        ]
        for field in required_fields:
            assert field in data
