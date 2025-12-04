"""
Integration tests for blog API routes
"""

import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session
from app.models import BlogPost


@pytest.mark.integration
class TestBlogRoutes:
    """Tests for blog endpoints"""

    def test_get_blog_posts_empty(self, client: TestClient, db: Session):
        """Test getting blog posts when database is empty"""
        response = client.get("/api/v1/blog/posts")

        assert response.status_code == 200
        assert response.json() == []

    def test_get_blog_posts(self, client: TestClient, multiple_blog_posts: list[BlogPost]):
        """Test getting all blog posts"""
        response = client.get("/api/v1/blog/posts")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 5
        assert all("id" in post for post in data)
        assert all("title" in post for post in data)
        assert all("type" in post for post in data)
        assert data[0]["type"] == "blog"

    def test_get_blog_posts_pagination(self, client: TestClient, multiple_blog_posts: list[BlogPost]):
        """Test blog posts pagination"""
        response = client.get("/api/v1/blog/posts?skip=0&limit=2")

        assert response.status_code == 200
        data = response.json()
        assert len(data) == 2

    def test_get_blog_posts_ordering(self, client: TestClient, multiple_blog_posts: list[BlogPost]):
        """Test blog posts are ordered by date descending"""
        response = client.get("/api/v1/blog/posts")

        assert response.status_code == 200
        data = response.json()

        # First post should be the most recent
        assert data[0]["title"] == "Test Post 1"
        assert data[-1]["title"] == "Test Post 5"

    def test_get_unified_feed_empty(self, client: TestClient, db: Session):
        """Test unified feed when database is empty"""
        response = client.get("/api/v1/blog/feed")

        assert response.status_code == 200
        data = response.json()
        # Should still have Instagram mock posts
        assert len(data) > 0
        assert any(post["type"] == "instagram" for post in data)

    def test_get_unified_feed_with_blog_posts(self, client: TestClient, multiple_blog_posts: list[BlogPost]):
        """Test unified feed combines blog and Instagram posts"""
        response = client.get("/api/v1/blog/feed")

        assert response.status_code == 200
        data = response.json()

        blog_posts = [p for p in data if p["type"] == "blog"]
        instagram_posts = [p for p in data if p["type"] == "instagram"]

        assert len(blog_posts) > 0
        assert len(instagram_posts) > 0

    def test_unified_feed_sorting(self, client: TestClient, multiple_blog_posts: list[BlogPost]):
        """Test unified feed is sorted by date"""
        response = client.get("/api/v1/blog/feed")

        assert response.status_code == 200
        data = response.json()

        # All posts should have published_date
        assert all("published_date" in post for post in data)

    def test_unified_feed_pagination(self, client: TestClient, multiple_blog_posts: list[BlogPost]):
        """Test unified feed pagination"""
        response = client.get("/api/v1/blog/feed?skip=0&limit=5")

        assert response.status_code == 200
        data = response.json()
        assert len(data) <= 5
