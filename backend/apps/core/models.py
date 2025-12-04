from django.db import models


class InstagramPost(models.Model):
    """Cache Instagram posts for performance"""

    instagram_id = models.CharField(max_length=100, unique=True)
    caption = models.TextField(blank=True)
    media_type = models.CharField(max_length=20)  # IMAGE, VIDEO, CAROUSEL_ALBUM
    media_url = models.URLField(max_length=500)
    permalink = models.URLField(max_length=500)
    timestamp = models.DateTimeField()

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-timestamp']
        indexes = [
            models.Index(fields=['-timestamp']),
        ]

    def __str__(self):
        return f"Instagram Post {self.instagram_id}"
