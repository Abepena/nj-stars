from django.contrib import admin
from django.utils.html import format_html
from django.urls import reverse
from django.http import HttpResponseRedirect
from django.contrib import messages
from .models import Coach, InstagramPost, NewsletterSubscriber, InstagramCredential


@admin.register(InstagramCredential)
class InstagramCredentialAdmin(admin.ModelAdmin):
    list_display = [
        'account_name',
        'instagram_username',
        'is_active',
        'is_primary',
        'token_status_display',
        'last_sync_at',
    ]
    list_filter = ['is_active', 'is_primary']
    search_fields = ['account_name', 'instagram_username']
    readonly_fields = [
        'token_status_display',
        'days_until_expiry_display',
        'token_issued_at',
        'last_refreshed_at',
        'last_sync_at',
        'last_error',
        'created_at',
        'updated_at',
    ]
    ordering = ['-is_primary', 'account_name']

    fieldsets = (
        ('Account', {
            'fields': ('account_name', 'instagram_username', 'instagram_user_id')
        }),
        ('Token Status', {
            'fields': (
                'token_status_display',
                'days_until_expiry_display',
                'token_issued_at',
                'last_refreshed_at',
            ),
            'description': 'Current token health. Tokens expire after 60 days.'
        }),
        ('Access Token', {
            'fields': ('access_token', 'token_expires_at'),
            'description': 'The Instagram API access token. App credentials (META_APP_ID, META_APP_SECRET) are read from .env for security.',
            'classes': ('collapse',)
        }),
        ('Status', {
            'fields': ('is_active', 'is_primary')
        }),
        ('Sync Info', {
            'fields': ('last_sync_at', 'last_error'),
            'classes': ('collapse',)
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    actions = ['refresh_tokens', 'sync_posts', 'verify_tokens']

    def token_status_display(self, obj):
        """Display token status with color coding"""
        status = obj.token_status
        if '❌' in status:
            return format_html('<span style="color: #dc3545;">{}</span>', status)
        elif '⚠️' in status:
            return format_html('<span style="color: #ffc107;">{}</span>', status)
        else:
            return format_html('<span style="color: #28a745;">{}</span>', status)
    token_status_display.short_description = 'Token Status'

    def days_until_expiry_display(self, obj):
        """Display days until expiry"""
        days = obj.days_until_expiry
        if days == 0:
            return format_html('<span style="color: #dc3545;">Expired</span>')
        elif days < 7:
            return format_html('<span style="color: #ffc107;">{} days</span>', days)
        else:
            return format_html('<span style="color: #28a745;">{} days</span>', days)
    days_until_expiry_display.short_description = 'Days Until Expiry'

    @admin.action(description='🔄 Refresh selected tokens')
    def refresh_tokens(self, request, queryset):
        from apps.core.services import refresh_instagram_token
        refreshed = 0
        failed = 0
        for credential in queryset:
            if credential.can_refresh:
                success, message = refresh_instagram_token(credential)
                if success:
                    refreshed += 1
                else:
                    failed += 1
                    messages.warning(request, f'@{credential.instagram_username}: {message}')
            else:
                failed += 1
                if credential.is_expired:
                    messages.error(request, f'@{credential.instagram_username}: Token expired, needs re-auth')
                else:
                    messages.warning(request, f'@{credential.instagram_username}: Missing app credentials')

        if refreshed:
            messages.success(request, f'Successfully refreshed {refreshed} token(s)')
        if failed:
            messages.error(request, f'Failed to refresh {failed} token(s)')

    @admin.action(description='📥 Sync posts from selected accounts')
    def sync_posts(self, request, queryset):
        from django.core.management import call_command
        from io import StringIO
        synced = 0
        for credential in queryset.filter(is_active=True):
            if not credential.is_expired:
                try:
                    out = StringIO()
                    call_command(
                        'sync_instagram',
                        account=credential.instagram_username,
                        verbosity=0,
                        stdout=out
                    )
                    synced += 1
                except Exception as e:
                    messages.error(request, f'@{credential.instagram_username}: {str(e)}')
        if synced:
            messages.success(request, f'Synced posts from {synced} account(s)')

    @admin.action(description='✅ Verify selected tokens')
    def verify_tokens(self, request, queryset):
        from apps.core.services import verify_token
        for credential in queryset:
            valid, message = verify_token(credential)
            if valid:
                messages.success(request, f'@{credential.instagram_username}: {message}')
            else:
                messages.error(request, f'@{credential.instagram_username}: {message}')


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
