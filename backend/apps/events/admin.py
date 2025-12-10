from django.contrib import admin
from django.contrib import messages
from django.utils.html import format_html
from django.utils import timezone
from .models import Event, CalendarSource
from .services import sync_calendar_source


@admin.register(CalendarSource)
class CalendarSourceAdmin(admin.ModelAdmin):
    list_display = ['name', 'is_active', 'default_event_type', 'last_synced_display', 'event_count', 'sync_status']
    list_filter = ['is_active', 'default_event_type']
    search_fields = ['name', 'ical_url']
    readonly_fields = ['last_synced_at', 'last_sync_count', 'sync_error', 'created_at', 'updated_at']
    actions = ['sync_selected_calendars']

    fieldsets = (
        (None, {
            'fields': ('name', 'ical_url', 'is_active')
        }),
        ('Import Settings', {
            'fields': ('default_event_type', 'auto_publish'),
            'description': 'These settings apply to newly imported events.'
        }),
        ('Sync Status', {
            'fields': ('last_synced_at', 'last_sync_count', 'sync_error'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def last_synced_display(self, obj):
        if obj.last_synced_at:
            return obj.last_synced_at.strftime('%Y-%m-%d %H:%M')
        return 'Never'
    last_synced_display.short_description = 'Last Synced'

    def event_count(self, obj):
        return obj.events.count()
    event_count.short_description = 'Events'

    def sync_status(self, obj):
        if obj.sync_error:
            return format_html(
                '<span style="color: #dc3545;">⚠ Error</span>'
            )
        if obj.last_synced_at:
            return format_html(
                '<span style="color: #28a745;">✓ OK</span>'
            )
        return format_html(
            '<span style="color: #6c757d;">—</span>'
        )
    sync_status.short_description = 'Status'

    @admin.action(description='Sync selected calendars now')
    def sync_selected_calendars(self, request, queryset):
        total_created = 0
        total_updated = 0
        errors = []

        for source in queryset:
            stats = sync_calendar_source(source)
            total_created += stats.get('created', 0)
            total_updated += stats.get('updated', 0)
            if stats.get('errors'):
                errors.extend(stats['errors'])

        if errors:
            self.message_user(
                request,
                f"Sync completed with errors. Created: {total_created}, Updated: {total_updated}. "
                f"Errors: {len(errors)}",
                messages.WARNING
            )
        else:
            self.message_user(
                request,
                f"Sync completed! Created: {total_created}, Updated: {total_updated}",
                messages.SUCCESS
            )


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = [
        'title', 'event_type', 'start_datetime', 'registration_open',
        'is_public', 'sync_source_display'
    ]
    list_filter = ['event_type', 'registration_open', 'is_public', 'calendar_source']
    search_fields = ['title', 'description', 'location']
    prepopulated_fields = {'slug': ('title',)}
    date_hierarchy = 'start_datetime'
    readonly_fields = ['created_at', 'updated_at', 'external_uid', 'calendar_source']
    actions = ['mark_locally_modified', 'clear_local_modifications']

    fieldsets = (
        (None, {
            'fields': ('title', 'slug', 'description', 'event_type')
        }),
        ('Date & Location', {
            'fields': ('start_datetime', 'end_datetime', 'location')
        }),
        ('Registration', {
            'fields': ('registration_open', 'registration_deadline', 'max_participants')
        }),
        ('Payment', {
            'fields': ('requires_payment', 'price', 'stripe_price_id'),
            'classes': ('collapse',)
        }),
        ('Visibility', {
            'fields': ('is_public',)
        }),
        ('Calendar Sync', {
            'fields': ('calendar_source', 'external_uid', 'is_locally_modified'),
            'classes': ('collapse',),
            'description': 'Events synced from external calendars. Enable "locally modified" to prevent overwriting your changes.'
        }),
        ('Metadata', {
            'fields': ('created_by', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def sync_source_display(self, obj):
        if obj.calendar_source:
            if obj.is_locally_modified:
                return format_html(
                    '<span style="color: #856404;">📅 {} (modified)</span>',
                    obj.calendar_source.name
                )
            return format_html(
                '<span style="color: #0056b3;">📅 {}</span>',
                obj.calendar_source.name
            )
        return '—'
    sync_source_display.short_description = 'Source'

    def save_model(self, request, obj, form, change):
        # Mark as locally modified if this is a synced event being edited
        if change and obj.calendar_source and obj.external_uid:
            # Check if any synced field changed
            synced_fields = ['title', 'description', 'location', 'start_datetime', 'end_datetime']
            if any(field in form.changed_data for field in synced_fields):
                obj.is_locally_modified = True
        super().save_model(request, obj, form, change)

    @admin.action(description='Mark as locally modified (prevent sync overwrites)')
    def mark_locally_modified(self, request, queryset):
        updated = queryset.filter(calendar_source__isnull=False).update(is_locally_modified=True)
        self.message_user(request, f"Marked {updated} event(s) as locally modified.", messages.SUCCESS)

    @admin.action(description='Clear local modifications (allow sync updates)')
    def clear_local_modifications(self, request, queryset):
        updated = queryset.update(is_locally_modified=False)
        self.message_user(request, f"Cleared local modifications for {updated} event(s).", messages.SUCCESS)
