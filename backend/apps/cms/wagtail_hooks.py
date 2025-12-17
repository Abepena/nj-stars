"""
Wagtail Admin Hooks - Unified CMS Interface

This file registers Django models in the Wagtail admin interface,
providing a single unified admin experience for non-technical users.

Menu Structure:
- Events & Programs: Events, Registrations
- Shop: Products, Orders
- Members: Players, Dues Accounts
- Staff: Coaches
- Communications: Newsletter Subscribers
"""

from django.utils.html import format_html
from django.db.models import Count, Sum
from django.utils import timezone
from wagtail import hooks
from wagtail_modeladmin.options import ModelAdmin, ModelAdminGroup, modeladmin_register

# Import models from apps
from apps.events.models import Event, CalendarSource
from apps.registrations.models import EventRegistration
from apps.payments.models import Product, Order
from apps.core.models import Coach, NewsletterSubscriber
from apps.portal.models import Player, DuesAccount


# =============================================================================
# EVENTS & PROGRAMS
# =============================================================================

class EventModelAdmin(ModelAdmin):
    """Admin for managing events - tryouts, camps, practices, etc."""
    model = Event
    menu_label = 'Events'
    menu_icon = 'date'
    menu_order = 100
    add_to_settings_menu = False
    list_display = ['title', 'event_type_badge', 'start_datetime', 'location', 'registration_status', 'spots_display']
    list_filter = ['event_type', 'registration_open', 'is_public']
    search_fields = ['title', 'description', 'location']
    ordering = ['-start_datetime']

    def event_type_badge(self, obj):
        """Display event type with colored badge"""
        colors = {
            'tryout': '#7c3aed',      # Purple
            'camp': '#059669',         # Green
            'tournament': '#dc2626',   # Red
            'practice': '#2563eb',     # Blue
            'open_gym': '#f59e0b',     # Amber
            'other': '#6b7280',        # Gray
        }
        color = colors.get(obj.event_type, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px; text-transform: uppercase;">{}</span>',
            color, obj.get_event_type_display()
        )
    event_type_badge.short_description = 'Type'
    event_type_badge.admin_order_field = 'event_type'

    def registration_status(self, obj):
        """Show registration open/closed status"""
        if obj.registration_open:
            return format_html('<span style="color: #059669;">Open</span>')
        return format_html('<span style="color: #dc2626;">Closed</span>')
    registration_status.short_description = 'Registration'

    def spots_display(self, obj):
        """Show registration count vs max"""
        count = obj.registrations.count() if hasattr(obj, 'registrations') else 0
        if obj.max_participants:
            if count >= obj.max_participants:
                return format_html('<span style="color: #dc2626;">{}/{} (Full)</span>', count, obj.max_participants)
            return format_html('{}/{}', count, obj.max_participants)
        return format_html('{} registered', count)
    spots_display.short_description = 'Spots'


class EventRegistrationModelAdmin(ModelAdmin):
    """Admin for managing event registrations"""
    model = EventRegistration
    menu_label = 'Registrations'
    menu_icon = 'user'
    menu_order = 200
    list_display = ['participant_name', 'event', 'payment_status_badge', 'registered_at']
    list_filter = ['payment_status', 'event', 'registered_at']
    search_fields = ['participant_first_name', 'participant_last_name', 'participant_email', 'event__title']
    ordering = ['-registered_at']
    list_export = ['csv', 'xlsx']  # Enable export for attendance lists
    inspect_view_enabled = True    # Enable read-only detail view

    # Hide technical fields from edit view
    form_fields_exclude = ['stripe_payment_intent_id']

    def participant_name(self, obj):
        """Display full participant name"""
        return f"{obj.participant_first_name} {obj.participant_last_name}"
    participant_name.short_description = 'Participant'

    def payment_status_badge(self, obj):
        """Display payment status with colored badge"""
        colors = {
            'pending': '#f59e0b',    # Amber
            'completed': '#059669',  # Green
            'failed': '#dc2626',     # Red
            'refunded': '#6b7280',   # Gray
        }
        color = colors.get(obj.payment_status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_payment_status_display()
        )
    payment_status_badge.short_description = 'Payment'


class EventsAdminGroup(ModelAdminGroup):
    """Group for Events & Programs section"""
    menu_label = 'Events & Programs'
    menu_icon = 'date'
    menu_order = 100
    items = (EventModelAdmin, EventRegistrationModelAdmin)


# =============================================================================
# SHOP
# =============================================================================

class ProductModelAdmin(ModelAdmin):
    """Admin for managing products/merch"""
    model = Product
    menu_label = 'Products'
    menu_icon = 'pick'
    menu_order = 100
    list_display = ['name', 'price_display', 'category', 'fulfillment_badge', 'stock_status', 'is_active']
    list_filter = ['category', 'fulfillment_type', 'is_active', 'featured']
    search_fields = ['name', 'description']
    ordering = ['-created_at']

    def price_display(self, obj):
        """Display formatted price"""
        return f"${obj.price:.2f}"
    price_display.short_description = 'Price'
    price_display.admin_order_field = 'price'

    def fulfillment_badge(self, obj):
        """Display POD vs Local badge"""
        if obj.is_pod:
            return format_html(
                '<span style="background: #7c3aed; color: white; padding: 3px 8px; '
                'border-radius: 4px; font-size: 11px;">POD</span>'
            )
        return format_html(
            '<span style="background: #059669; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">Local</span>'
        )
    fulfillment_badge.short_description = 'Type'

    def stock_status(self, obj):
        """Display stock status"""
        if obj.is_discontinued:
            return format_html('<span style="color: #dc2626;">Discontinued</span>')
        if obj.is_pod:
            return format_html('<span style="color: #7c3aed;">POD (unlimited)</span>')
        if not obj.manage_inventory:
            return format_html('<span style="color: #059669;">In Stock</span>')
        if obj.stock_quantity <= 0:
            return format_html('<span style="color: #dc2626;">Out of Stock</span>')
        if obj.stock_quantity <= 5:
            return format_html('<span style="color: #f59e0b;">{} left</span>', obj.stock_quantity)
        return format_html('<span style="color: #059669;">{} in stock</span>', obj.stock_quantity)
    stock_status.short_description = 'Stock'


class OrderModelAdmin(ModelAdmin):
    """Admin for viewing orders"""
    model = Order
    menu_label = 'Orders'
    menu_icon = 'doc-full'
    menu_order = 200
    list_display = ['order_number', 'customer_display', 'status_badge', 'total_display', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['order_number', 'user__email', 'shipping_email']
    ordering = ['-created_at']
    list_export = ['csv', 'xlsx']  # Enable export for sales reports
    inspect_view_enabled = True    # Enable read-only detail view

    def customer_display(self, obj):
        """Display customer email"""
        if obj.user:
            return obj.user.email
        return obj.shipping_email or 'Guest'
    customer_display.short_description = 'Customer'

    def total_display(self, obj):
        """Display formatted total"""
        return f"${obj.total:.2f}"
    total_display.short_description = 'Total'
    total_display.admin_order_field = 'total'

    def status_badge(self, obj):
        """Display order status with colored badge"""
        colors = {
            'pending': '#f59e0b',     # Amber
            'processing': '#2563eb',  # Blue
            'shipped': '#7c3aed',     # Purple
            'delivered': '#059669',   # Green
            'cancelled': '#dc2626',   # Red
            'refunded': '#6b7280',    # Gray
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


class ShopAdminGroup(ModelAdminGroup):
    """Group for Shop section"""
    menu_label = 'Shop'
    menu_icon = 'pick'
    menu_order = 200
    items = (ProductModelAdmin, OrderModelAdmin)


# =============================================================================
# MEMBERS
# =============================================================================

class PlayerModelAdmin(ModelAdmin):
    """Admin for managing players/roster"""
    model = Player
    menu_label = 'Players'
    menu_icon = 'group'
    menu_order = 100
    list_display = ['full_name', 'team_name', 'position', 'age', 'is_active']
    list_filter = ['team_name', 'is_active', 'position']
    search_fields = ['first_name', 'last_name', 'email']
    ordering = ['last_name', 'first_name']
    list_export = ['csv', 'xlsx']  # Enable export for roster management


class DuesAccountModelAdmin(ModelAdmin):
    """Admin for viewing player dues accounts"""
    model = DuesAccount
    menu_label = 'Dues Accounts'
    menu_icon = 'form'
    menu_order = 200
    list_display = ['player_name', 'balance_display', 'is_good_standing', 'last_payment_date']
    list_filter = ['is_good_standing']
    search_fields = ['player__first_name', 'player__last_name']

    def player_name(self, obj):
        """Display player full name"""
        return obj.player.full_name
    player_name.short_description = 'Player'

    def balance_display(self, obj):
        """Display formatted balance with color coding"""
        if obj.balance > 0:
            return format_html('<span style="color: #dc2626;">${:.2f} owed</span>', obj.balance)
        elif obj.balance < 0:
            return format_html('<span style="color: #059669;">${:.2f} credit</span>', abs(obj.balance))
        return format_html('<span style="color: #059669;">$0.00</span>')
    balance_display.short_description = 'Balance'


class MembersAdminGroup(ModelAdminGroup):
    """Group for Members section"""
    menu_label = 'Members'
    menu_icon = 'group'
    menu_order = 300
    items = (PlayerModelAdmin, DuesAccountModelAdmin)


# =============================================================================
# STAFF
# =============================================================================

class CoachModelAdmin(ModelAdmin):
    """Admin for managing coaching staff"""
    model = Coach
    menu_label = 'Coaches'
    menu_icon = 'user'
    menu_order = 100
    list_display = ['display_name', 'role', 'title', 'is_active', 'order']
    list_filter = ['role', 'is_active']
    search_fields = ['name', 'display_name', 'bio']
    ordering = ['order', 'name']


class StaffAdminGroup(ModelAdminGroup):
    """Group for Staff section"""
    menu_label = 'Staff'
    menu_icon = 'user'
    menu_order = 400
    items = (CoachModelAdmin,)


# =============================================================================
# COMMUNICATIONS
# =============================================================================

class NewsletterSubscriberModelAdmin(ModelAdmin):
    """Admin for managing newsletter subscribers"""
    model = NewsletterSubscriber
    menu_label = 'Subscribers'
    menu_icon = 'mail'
    menu_order = 100
    list_display = ['email', 'first_name', 'status_badge', 'source', 'subscribed_at']
    list_filter = ['status', 'source', 'subscribe_events', 'subscribe_news']
    search_fields = ['email', 'first_name']
    ordering = ['-subscribed_at']
    list_export = ['csv', 'xlsx']  # Enable export for email campaigns

    def status_badge(self, obj):
        """Display subscription status with colored badge"""
        colors = {
            'active': '#059669',      # Green
            'unsubscribed': '#6b7280', # Gray
            'bounced': '#dc2626',      # Red
        }
        color = colors.get(obj.status, '#6b7280')
        return format_html(
            '<span style="background: {}; color: white; padding: 3px 8px; '
            'border-radius: 4px; font-size: 11px;">{}</span>',
            color, obj.get_status_display()
        )
    status_badge.short_description = 'Status'


class CommunicationsAdminGroup(ModelAdminGroup):
    """Group for Communications section"""
    menu_label = 'Communications'
    menu_icon = 'mail'
    menu_order = 500
    items = (NewsletterSubscriberModelAdmin,)


# =============================================================================
# REGISTER ALL GROUPS
# =============================================================================

modeladmin_register(EventsAdminGroup)
modeladmin_register(ShopAdminGroup)
modeladmin_register(MembersAdminGroup)
modeladmin_register(StaffAdminGroup)
modeladmin_register(CommunicationsAdminGroup)


# =============================================================================
# DASHBOARD HOME PANEL
# =============================================================================

from wagtail.admin.ui.components import Component


class DashboardPanel(Component):
    """Custom dashboard panel showing business metrics at a glance"""
    order = 50
    template_name = 'cms/admin/dashboard_panel.html'

    def get_context_data(self, parent_context):
        context = super().get_context_data(parent_context)

        # Get upcoming events
        upcoming_events = Event.objects.filter(
            start_datetime__gte=timezone.now()
        ).order_by('start_datetime')[:5]

        # Get recent registrations
        recent_registrations = EventRegistration.objects.select_related(
            'event'
        ).order_by('-registered_at')[:5]

        # Get recent orders
        recent_orders = Order.objects.order_by('-created_at')[:5]

        # Calculate stats
        total_players = Player.objects.filter(is_active=True).count()
        pending_registrations = EventRegistration.objects.filter(
            payment_status='pending'
        ).count()
        unfulfilled_orders = Order.objects.filter(
            status__in=['pending', 'processing']
        ).count()

        # Revenue this month
        month_start = timezone.now().replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        monthly_revenue = Order.objects.filter(
            status='delivered',
            created_at__gte=month_start
        ).aggregate(total=Sum('total'))['total'] or 0

        context.update({
            'upcoming_events': upcoming_events,
            'recent_registrations': recent_registrations,
            'recent_orders': recent_orders,
            'total_players': total_players,
            'pending_registrations': pending_registrations,
            'unfulfilled_orders': unfulfilled_orders,
            'monthly_revenue': monthly_revenue,
        })
        return context


@hooks.register('construct_homepage_panels')
def add_dashboard_panel(request, panels):
    """Add the custom dashboard panel to Wagtail admin homepage"""
    panels.append(DashboardPanel())
