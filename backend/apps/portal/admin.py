from django.contrib import admin
from django.utils.html import format_html
from .models import (
    UserProfile, Player, GuardianRelationship,
    DuesAccount, DuesTransaction, SavedPaymentMethod,
    PromoCredit, EventCheckIn
)


@admin.register(UserProfile)
class UserProfileAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'role', 'phone', 'auto_pay_enabled', 'profile_completeness_display']
    list_filter = ['role', 'auto_pay_enabled', 'state']
    search_fields = ['user__email', 'user__first_name', 'user__last_name', 'phone']
    readonly_fields = ['created_at', 'updated_at', 'profile_completeness']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'Email'

    def profile_completeness_display(self, obj):
        pct = obj.profile_completeness
        color = 'green' if pct >= 80 else 'orange' if pct >= 50 else 'red'
        return format_html(
            '<span style="color: {};">{} %</span>',
            color, pct
        )
    profile_completeness_display.short_description = 'Completeness'


class GuardianRelationshipInline(admin.TabularInline):
    model = GuardianRelationship
    extra = 1
    autocomplete_fields = ['guardian']


@admin.register(Player)
class PlayerAdmin(admin.ModelAdmin):
    list_display = ['full_name', 'age', 'team_name', 'position', 'is_active', 'guardian_count']
    list_filter = ['team_name', 'is_active', 'position']
    search_fields = ['first_name', 'last_name', 'email']
    readonly_fields = ['age', 'created_at', 'updated_at']
    inlines = [GuardianRelationshipInline]

    fieldsets = (
        ('Basic Info', {
            'fields': ('first_name', 'last_name', 'date_of_birth', 'age', 'email', 'phone')
        }),
        ('Team Info', {
            'fields': ('team_name', 'jersey_number', 'position')
        }),
        ('Photo', {
            'fields': ('photo', 'photo_url')
        }),
        ('Emergency Contact', {
            'fields': ('emergency_contact_name', 'emergency_contact_phone', 'emergency_contact_relationship')
        }),
        ('Medical', {
            'fields': ('medical_notes',),
            'classes': ('collapse',)
        }),
        ('Account', {
            'fields': ('user', 'is_active')
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def guardian_count(self, obj):
        return obj.guardian_relationships.count()
    guardian_count.short_description = 'Guardians'


@admin.register(GuardianRelationship)
class GuardianRelationshipAdmin(admin.ModelAdmin):
    list_display = ['guardian_email', 'player_name', 'relationship', 'is_primary', 'can_pickup']
    list_filter = ['relationship', 'is_primary', 'can_pickup']
    search_fields = ['guardian__email', 'player__first_name', 'player__last_name']
    autocomplete_fields = ['guardian', 'player']

    def guardian_email(self, obj):
        return obj.guardian.email
    guardian_email.short_description = 'Guardian'

    def player_name(self, obj):
        return obj.player.full_name
    player_name.short_description = 'Player'


class DuesTransactionInline(admin.TabularInline):
    model = DuesTransaction
    extra = 0
    readonly_fields = ['transaction_type', 'amount', 'description', 'balance_after', 'created_at']
    can_delete = False

    def has_add_permission(self, request, obj=None):
        return False


@admin.register(DuesAccount)
class DuesAccountAdmin(admin.ModelAdmin):
    list_display = ['player_name', 'balance_display', 'is_good_standing', 'last_payment_date']
    list_filter = ['is_good_standing']
    search_fields = ['player__first_name', 'player__last_name']
    readonly_fields = ['created_at', 'updated_at']
    inlines = [DuesTransactionInline]

    def player_name(self, obj):
        return obj.player.full_name
    player_name.short_description = 'Player'

    def balance_display(self, obj):
        if obj.balance > 0:
            return format_html('<span style="color: red;">${:.2f}</span>', obj.balance)
        elif obj.balance < 0:
            return format_html('<span style="color: green;">${:.2f} credit</span>', abs(obj.balance))
        return format_html('<span style="color: green;">$0.00</span>')
    balance_display.short_description = 'Balance'


@admin.register(DuesTransaction)
class DuesTransactionAdmin(admin.ModelAdmin):
    list_display = ['account_player', 'transaction_type', 'amount', 'description', 'balance_after', 'created_at']
    list_filter = ['transaction_type', 'created_at']
    search_fields = ['account__player__first_name', 'account__player__last_name', 'description']
    readonly_fields = ['created_at']
    date_hierarchy = 'created_at'

    def account_player(self, obj):
        return obj.account.player.full_name
    account_player.short_description = 'Player'


@admin.register(SavedPaymentMethod)
class SavedPaymentMethodAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'display_name', 'is_default', 'is_expired_display', 'created_at']
    list_filter = ['card_brand', 'is_default']
    search_fields = ['user__email', 'nickname']
    readonly_fields = ['created_at']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'

    def is_expired_display(self, obj):
        if obj.is_expired:
            return format_html('<span style="color: red;">Expired</span>')
        return format_html('<span style="color: green;">Valid</span>')
    is_expired_display.short_description = 'Status'


@admin.register(PromoCredit)
class PromoCreditAdmin(admin.ModelAdmin):
    list_display = ['user_email', 'credit_type', 'amount', 'remaining_amount', 'is_active', 'expires_at']
    list_filter = ['credit_type', 'is_active']
    search_fields = ['user__email', 'description']
    readonly_fields = ['created_at']

    def user_email(self, obj):
        return obj.user.email
    user_email.short_description = 'User'


@admin.register(EventCheckIn)
class EventCheckInAdmin(admin.ModelAdmin):
    list_display = ['participant_name', 'event_title', 'check_in_status', 'checked_in_at', 'checked_out_at']
    list_filter = ['checked_in_at', 'checked_out_at']
    search_fields = [
        'event_registration__participant_first_name',
        'event_registration__participant_last_name',
        'event_registration__event__title'
    ]
    readonly_fields = ['checked_in_by']
    date_hierarchy = 'checked_in_at'

    def participant_name(self, obj):
        return f"{obj.event_registration.participant_first_name} {obj.event_registration.participant_last_name}"
    participant_name.short_description = 'Participant'

    def event_title(self, obj):
        return obj.event_registration.event.title
    event_title.short_description = 'Event'

    def check_in_status(self, obj):
        if obj.is_checked_in:
            return format_html('<span style="color: green;">✓ Checked In</span>')
        elif obj.is_checked_out:
            return format_html('<span style="color: gray;">Checked Out</span>')
        return format_html('<span style="color: orange;">Not Checked In</span>')
    check_in_status.short_description = 'Status'
