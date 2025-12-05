from django.apps import AppConfig


class CoreConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    # Use full dotted path so Django can discover the app correctly
    name = "apps.core"
