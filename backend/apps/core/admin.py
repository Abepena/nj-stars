from django.contrib import admin
from .models import Coach, InstagramPost, NewsletterSubscriber


@admin.register(Coach)
class CoachAdmin(admin.ModelAdmin):
    list_display = ['display_name', 'name', 'role', 'instagram_handle', 'is_active', 'order']
    list_filter = ['role', 'is_active']
    search_fields = ['name', 'display_name', 'instagram_handle', 'bio']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    ordering = ['order', 'name']
    fieldsets = (
        ('Basic Info', {
            'fields': ('name', 'display_name', 'slug', 'role', 'title', 'bio')
        }),
        ('Photo', {
            'fields': ('photo_url',)
        }),
        ('Contact & Social', {
            'fields': ('email', 'phone', 'instagram_handle')
        }),
        ('Specialties', {
            'fields': ('specialties',),
            'description': 'Enter as comma-separated values'
        }),
        ('Status', {
            'fields': ('is_active', 'order')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )


@admin.register(InstagramPost)
class InstagramPostAdmin(admin.ModelAdmin):
    list_display = ['instagram_id', 'media_type', 'timestamp', 'created_at']
    list_filter = ['media_type']
    search_fields = ['instagram_id', 'caption']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'timestamp'


@admin.register(NewsletterSubscriber)
class NewsletterSubscriberAdmin(admin.ModelAdmin):
    list_display = ['email', 'first_name', 'status', 'source', 'subscribed_at']
    list_filter = ['status', 'source', 'subscribe_events', 'subscribe_news', 'subscribe_promotions']
    search_fields = ['email', 'first_name']
    readonly_fields = ['subscribed_at', 'unsubscribed_at', 'created_at', 'updated_at']
    date_hierarchy = 'subscribed_at'
    ordering = ['-subscribed_at']
    fieldsets = (
        ('Subscriber Info', {
            'fields': ('email', 'first_name', 'status')
        }),
        ('Preferences', {
            'fields': ('subscribe_events', 'subscribe_news', 'subscribe_promotions')
        }),
        ('Tracking', {
            'fields': ('source', 'subscribed_at', 'unsubscribed_at'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['mark_as_unsubscribed', 'mark_as_active']

    @admin.action(description='Mark selected subscribers as unsubscribed')
    def mark_as_unsubscribed(self, request, queryset):
        from django.utils import timezone
        queryset.update(status='unsubscribed', unsubscribed_at=timezone.now())

    @admin.action(description='Mark selected subscribers as active')
    def mark_as_active(self, request, queryset):
        queryset.update(status='active', unsubscribed_at=None)


from .models import ContactSubmission


@admin.register(ContactSubmission)
class ContactSubmissionAdmin(admin.ModelAdmin):
    list_display = ['subject', 'name', 'email', 'category', 'status', 'priority', 'created_at']
    list_filter = ['status', 'priority', 'category', 'created_at']
    search_fields = ['name', 'email', 'subject', 'message']
    readonly_fields = ['created_at', 'updated_at', 'ip_address', 'user_agent', 'resolved_at']
    date_hierarchy = 'created_at'
    ordering = ['-created_at']
    raw_id_fields = ['assigned_to', 'resolved_by']
    fieldsets = (
        ('Contact Info', {
            'fields': ('name', 'email', 'phone')
        }),
        ('Submission', {
            'fields': ('category', 'subject', 'message')
        }),
        ('Status', {
            'fields': ('status', 'priority', 'assigned_to', 'admin_notes')
        }),
        ('Resolution', {
            'fields': ('resolved_at', 'resolved_by'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('ip_address', 'user_agent', 'created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )
    actions = ['mark_as_resolved', 'mark_as_in_progress']

    @admin.action(description='Mark selected as resolved')
    def mark_as_resolved(self, request, queryset):
        from django.utils import timezone
        queryset.update(
            status='resolved',
            resolved_at=timezone.now(),
            resolved_by=request.user
        )

    @admin.action(description='Mark selected as in progress')
    def mark_as_in_progress(self, request, queryset):
        queryset.update(status='in_progress')
