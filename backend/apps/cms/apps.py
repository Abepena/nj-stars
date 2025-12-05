from django.apps import AppConfig


class CmsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    # Use full dotted path so Django can discover the app correctly
    name = "apps.cms"
