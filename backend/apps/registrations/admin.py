from django.contrib import admin
from .models import EventRegistration


@admin.register(EventRegistration)
class EventRegistrationAdmin(admin.ModelAdmin):
    list_display = ['participant_first_name', 'participant_last_name', 'event', 'payment_status', 'registered_at']
    list_filter = ['payment_status', 'event']
    search_fields = ['participant_first_name', 'participant_last_name', 'participant_email', 'user__email']
    readonly_fields = ['registered_at', 'updated_at']
    date_hierarchy = 'registered_at'
