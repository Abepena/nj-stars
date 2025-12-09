from django.contrib import admin
from django.utils.html import format_html
from .models import SubscriptionPlan, Subscription, Payment, Product, ProductImage, Order, OrderItem, Cart, CartItem


@admin.register(SubscriptionPlan)
class SubscriptionPlanAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'billing_period', 'is_active', 'is_team_dues']
    list_filter = ['billing_period', 'is_active', 'is_team_dues']
    search_fields = ['name', 'description']
    # Slug should derive from the plan name
    prepopulated_fields = {'slug': ('name',)}


@admin.register(Subscription)
class SubscriptionAdmin(admin.ModelAdmin):
    list_display = ['user', 'plan', 'status', 'current_period_end']
    list_filter = ['status', 'plan']
    search_fields = ['user__email', 'stripe_subscription_id']
    readonly_fields = ['created_at', 'updated_at']


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ['user', 'amount', 'status', 'created_at']
    list_filter = ['status']
    search_fields = ['user__email', 'stripe_payment_intent_id']
    readonly_fields = ['created_at', 'updated_at']
    date_hierarchy = 'created_at'


class ProductImageInline(admin.TabularInline):
    model = ProductImage
    extra = 1
    fields = ['image', 'image_url', 'image_preview', 'alt_text', 'is_primary', 'sort_order']
    readonly_fields = ['image_preview']
    ordering = ['sort_order', 'created_at']

    def image_preview(self, obj):
        # Preview uploaded image
        if obj.image:
            return format_html(
                '<img src="{}" style="max-height: 80px; max-width: 80px; object-fit: cover; border-radius: 4px;" />',
                obj.image.url
            )
        # Preview URL image
        if obj.image_url:
            return format_html(
                '<img src="{}" style="max-height: 80px; max-width: 80px; object-fit: cover; border-radius: 4px;" '
                'onerror="this.style.display=\'none\'" />',
                obj.image_url
            )
        return "-"
    image_preview.short_description = "Preview"


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    list_display = ['name', 'price', 'category', 'stock_quantity', 'is_active', 'featured', 'image_count']
    list_filter = ['category', 'is_active', 'featured', 'best_selling', 'on_sale']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at']
    inlines = [ProductImageInline]

    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'description')
        }),
        ('Pricing', {
            'fields': ('price', 'compare_at_price')
        }),
        ('Categorization & Status', {
            'fields': ('category', 'is_active', 'featured', 'best_selling', 'on_sale')
        }),
        ('Inventory', {
            'fields': ('manage_inventory', 'stock_quantity')
        }),
        ('Stripe Integration', {
            'fields': ('stripe_price_id', 'stripe_product_id'),
            'classes': ('collapse',)
        }),
        ('Printify Integration (Phase 2)', {
            'fields': ('printify_product_id', 'printify_variant_id'),
            'classes': ('collapse',)
        }),
        ('Legacy Image', {
            'fields': ('image_url',),
            'classes': ('collapse',),
            'description': 'Legacy single image URL. Use the Images section below for multiple images.'
        }),
        ('Metadata', {
            'fields': ('created_at', 'updated_at'),
            'classes': ('collapse',)
        }),
    )

    def image_count(self, obj):
        count = obj.images.count()
        return count if count > 0 else '-'
    image_count.short_description = "Images"


class OrderItemInline(admin.TabularInline):
    model = OrderItem
    extra = 0
    readonly_fields = ['total_price']


@admin.register(Order)
class OrderAdmin(admin.ModelAdmin):
    list_display = ['order_number', 'user', 'status', 'total', 'created_at']
    list_filter = ['status']
    search_fields = ['order_number', 'user__email', 'shipping_email']
    readonly_fields = ['order_number', 'created_at', 'updated_at']
    date_hierarchy = 'created_at'
    inlines = [OrderItemInline]


class CartItemInline(admin.TabularInline):
    model = CartItem
    extra = 0
    readonly_fields = ['total_price', 'added_at']


@admin.register(Cart)
class CartAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_key_short', 'item_count', 'subtotal', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['user__email', 'session_key']
    readonly_fields = ['created_at', 'updated_at', 'item_count', 'subtotal']
    inlines = [CartItemInline]

    def session_key_short(self, obj):
        if obj.session_key:
            return f"{obj.session_key[:8]}..."
        return "-"
    session_key_short.short_description = "Session Key"
