"""
Unit tests for Instagram service
"""

import pytest
from unittest.mock import patch, Mock
from app.services.instagram import InstagramService


@pytest.mark.unit
@pytest.mark.instagram
class TestInstagramService:
    """Tests for Instagram service"""

    def test_get_mock_posts(self):
        """Test getting mock Instagram posts"""
        posts = InstagramService.get_mock_posts()

        assert len(posts) == 5
        assert all("id" in post for post in posts)
        assert all("media_type" in post for post in posts)
        assert all("media_url" in post for post in posts)
        assert all("caption" in post for post in posts)
        assert all("timestamp" in post for post in posts)
        assert all("permalink" in post for post in posts)

    def test_get_user_media_without_token(self):
        """Test get_user_media returns mock data when no token configured"""
        with patch("app.services.instagram.settings.INSTAGRAM_ACCESS_TOKEN", ""):
            posts = InstagramService.get_user_media(limit=3)

            assert len(posts) == 3
            assert posts[0]["id"] == "mock_1"

    def test_get_user_media_with_limit(self):
        """Test limiting the number of posts returned"""
        posts = InstagramService.get_user_media(limit=2)

        assert len(posts) == 2

    @patch("app.services.instagram.requests.get")
    @patch("app.services.instagram.settings.INSTAGRAM_ACCESS_TOKEN", "test_token")
    def test_get_user_media_with_token_success(self, mock_get):
        """Test successful API call with token"""
        mock_response = Mock()
        mock_response.json.return_value = {
            "data": [
                {
                    "id": "real_post_1",
                    "media_type": "IMAGE",
                    "media_url": "https://example.com/image1.jpg",
                    "caption": "Real post",
                    "timestamp": "2024-01-01T00:00:00+0000",
                    "permalink": "https://instagram.com/p/real1",
                }
            ]
        }
        mock_response.raise_for_status.return_value = None
        mock_get.return_value = mock_response

        posts = InstagramService.get_user_media(limit=5)

        assert len(posts) == 1
        assert posts[0]["id"] == "real_post_1"
        mock_get.assert_called_once()

    @patch("app.services.instagram.requests.get")
    @patch("app.services.instagram.settings.INSTAGRAM_ACCESS_TOKEN", "test_token")
    def test_get_user_media_api_failure_fallback(self, mock_get):
        """Test fallback to mock data on API failure"""
        mock_get.side_effect = Exception("API Error")

        posts = InstagramService.get_user_media(limit=3)

        # Should fallback to mock data
        assert len(posts) == 3
        assert posts[0]["id"] == "mock_1"

    def test_format_post_for_feed(self):
        """Test formatting Instagram post for unified feed"""
        instagram_post = {
            "id": "123",
            "media_type": "IMAGE",
            "media_url": "https://example.com/image.jpg",
            "caption": "This is a test caption that is longer than 100 characters to test the truncation functionality in the format method",
            "timestamp": "2024-01-01T00:00:00+0000",
            "permalink": "https://instagram.com/p/test",
        }

        formatted = InstagramService.format_post_for_feed(instagram_post)

        assert formatted["id"] == "ig_123"
        assert formatted["type"] == "instagram"
        assert "..." in formatted["title"]  # Caption should be truncated
        assert formatted["content"] == instagram_post["caption"]
        assert formatted["image_url"] == instagram_post["media_url"]
        assert formatted["media_type"] == "IMAGE"
        assert formatted["permalink"] == instagram_post["permalink"]

    def test_format_post_with_thumbnail(self):
        """Test formatting video post with thumbnail"""
        video_post = {
            "id": "456",
            "media_type": "VIDEO",
            "media_url": "https://example.com/video.mp4",
            "thumbnail_url": "https://example.com/thumbnail.jpg",
            "caption": "Video post",
            "timestamp": "2024-01-01T00:00:00+0000",
            "permalink": "https://instagram.com/p/video",
        }

        formatted = InstagramService.format_post_for_feed(video_post)

        assert formatted["image_url"] == video_post["thumbnail_url"]
        assert formatted["media_type"] == "VIDEO"

    def test_format_post_without_caption(self):
        """Test formatting post with no caption"""
        post = {
            "id": "789",
            "media_type": "IMAGE",
            "media_url": "https://example.com/image.jpg",
            "timestamp": "2024-01-01T00:00:00+0000",
            "permalink": "https://instagram.com/p/nocaption",
        }

        formatted = InstagramService.format_post_for_feed(post)

        assert formatted["title"] == "Instagram Post"
        assert formatted["content"] == ""
