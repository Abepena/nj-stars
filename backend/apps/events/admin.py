from django.contrib import admin
from .models import Event


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ['title', 'event_type', 'start_datetime', 'registration_open', 'is_public']
    list_filter = ['event_type', 'registration_open', 'is_public']
    search_fields = ['title', 'description', 'location']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'start_datetime'
    readonly_fields = ['created_at', 'updated_at']
