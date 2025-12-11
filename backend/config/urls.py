"""
URL configuration for config project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""

from django.conf import settings
from django.conf.urls.static import static
from django.contrib import admin
from django.urls import path, include
from wagtail.admin import urls as wagtailadmin_urls
from wagtail import urls as wagtail_urls
from wagtail.documents import urls as wagtaildocs_urls

from apps.cms.api import api_router as wagtail_api_router
from apps.portal.views import confirm_email

urlpatterns = [
    # Django Admin
    path("django-admin/", admin.site.urls),

    # Wagtail Admin
    path("cms-admin/", include(wagtailadmin_urls)),

    # Wagtail Documents
    path("documents/", include(wagtaildocs_urls)),

    # Wagtail API v2 (for frontend to fetch CMS content)
    path("api/v2/", wagtail_api_router.urls),

    # API endpoints
    path("api/events/", include("apps.events.urls")),
    path("api/payments/", include("apps.payments.urls")),
    path("api/portal/", include("apps.portal.urls")),
    path("api/", include("apps.core.urls")),

    # Authentication API (dj-rest-auth)
    path("api/auth/", include("dj_rest_auth.urls")),
    # Custom email confirmation view (must be before registration urls to override)
    path("api/auth/registration/account-confirm-email/<str:key>/", confirm_email, name="account_confirm_email"),
    path("api/auth/registration/", include("dj_rest_auth.registration.urls")),

    # Wagtail pages - must be last
    path("cms/", include(wagtail_urls)),
]

# Serve media files in development
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
