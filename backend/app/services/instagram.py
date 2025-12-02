import requests
from typing import List, Dict, Optional
from datetime import datetime
from app.core.config import settings


class InstagramService:
    """Service for fetching Instagram posts via Instagram Basic Display API"""

    BASE_URL = "https://graph.instagram.com"

    @staticmethod
    def get_mock_posts() -> List[Dict]:
        """
        Returns mock Instagram post data for development/testing.

        Use this when INSTAGRAM_ACCESS_TOKEN is not configured.
        """
        return [
            {
                "id": "mock_1",
                "media_type": "IMAGE",
                "media_url": "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=800",
                "caption": "🏀 Championship win! NJ Stars dominate the finals. #NJStars #Basketball",
                "timestamp": "2024-01-15T10:30:00+0000",
                "permalink": "https://instagram.com/p/mock1"
            },
            {
                "id": "mock_2",
                "media_type": "IMAGE",
                "media_url": "https://images.unsplash.com/photo-1608245449230-4ac19066d2d0?w=800",
                "caption": "Team practice highlights 💪 Getting ready for the big game!",
                "timestamp": "2024-01-12T14:20:00+0000",
                "permalink": "https://instagram.com/p/mock2"
            },
            {
                "id": "mock_3",
                "media_type": "CAROUSEL_ALBUM",
                "media_url": "https://images.unsplash.com/photo-1519861531473-9200262188bf?w=800",
                "caption": "Open gym sessions are back! Check the schedule 🔥",
                "timestamp": "2024-01-10T09:15:00+0000",
                "permalink": "https://instagram.com/p/mock3"
            },
            {
                "id": "mock_4",
                "media_type": "VIDEO",
                "media_url": "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800",
                "thumbnail_url": "https://images.unsplash.com/photo-1574623452334-1e0ac2b3ccb4?w=800",
                "caption": "Incredible buzzer-beater by our star player! 🏀✨",
                "timestamp": "2024-01-08T18:45:00+0000",
                "permalink": "https://instagram.com/p/mock4"
            },
            {
                "id": "mock_5",
                "media_type": "IMAGE",
                "media_url": "https://images.unsplash.com/photo-1515523110800-9415d13b84a8?w=800",
                "caption": "New team jerseys just dropped! Get yours at the merch store 👕",
                "timestamp": "2024-01-05T12:00:00+0000",
                "permalink": "https://instagram.com/p/mock5"
            }
        ]

    @classmethod
    def get_user_media(cls, limit: int = 5) -> List[Dict]:
        """
        Fetch recent media from Instagram user account.

        Args:
            limit: Number of posts to fetch (default: 5)

        Returns:
            List of Instagram media objects with id, media_type, media_url,
            caption, timestamp, and permalink
        """
        # Return mock data if token not configured
        if not settings.INSTAGRAM_ACCESS_TOKEN:
            return cls.get_mock_posts()[:limit]

        try:
            # Construct API request
            url = f"{cls.BASE_URL}/me/media"
            params = {
                "fields": "id,media_type,media_url,thumbnail_url,caption,timestamp,permalink",
                "access_token": settings.INSTAGRAM_ACCESS_TOKEN,
                "limit": limit
            }

            response = requests.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            return data.get("data", [])

        except requests.RequestException as e:
            # Fallback to mock data on error
            print(f"Instagram API error: {str(e)}")
            return cls.get_mock_posts()[:limit]

    @staticmethod
    def format_post_for_feed(post: Dict) -> Dict:
        """
        Format Instagram post for unified news feed display.

        Transforms Instagram API response into a standardized format
        that matches the blog post structure.
        """
        return {
            "id": f"ig_{post['id']}",
            "type": "instagram",
            "title": post.get("caption", "")[:100] + "..." if post.get("caption", "") else "Instagram Post",
            "content": post.get("caption", ""),
            "image_url": post.get("thumbnail_url") or post.get("media_url"),
            "media_type": post.get("media_type", "IMAGE"),
            "published_date": post.get("timestamp"),
            "permalink": post.get("permalink")
        }
