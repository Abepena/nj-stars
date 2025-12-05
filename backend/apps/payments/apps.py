from django.apps import AppConfig


class PaymentsConfig(AppConfig):
    default_auto_field = "django.db.models.BigAutoField"
    # Use full dotted path so Django can discover the app correctly
    name = "apps.payments"
