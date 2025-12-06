"""
Wagtail API v2 Router Configuration

This module exposes Wagtail CMS content via REST API endpoints.
The frontend (Next.js) uses these endpoints to fetch page content.

Endpoints created:
- /api/v2/pages/ - List/retrieve CMS pages (HomePage, BlogPage, TeamPage)
- /api/v2/images/ - List/retrieve uploaded images
- /api/v2/documents/ - List/retrieve uploaded documents
"""

from wagtail.api.v2.router import WagtailAPIRouter
from wagtail.api.v2.views import PagesAPIViewSet
from wagtail.images.api.v2.views import ImagesAPIViewSet
from wagtail.documents.api.v2.views import DocumentsAPIViewSet


# Create the router instance
api_router = WagtailAPIRouter("wagtailapi")

# Register the standard Wagtail API endpoints
api_router.register_endpoint("pages", PagesAPIViewSet)
api_router.register_endpoint("images", ImagesAPIViewSet)
api_router.register_endpoint("documents", DocumentsAPIViewSet)
