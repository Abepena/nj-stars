from django.contrib import admin
from django.utils.html import format_html
from django import forms
from django.db import models
from .models import SubscriptionPlan, Subscription, Payment, Product, ProductImage, ProductVariant, Order, OrderItem, Bag, BagItem


class MultipleFileInput(forms.ClearableFileInput):
    """Custom widget that allows multiple file selection"""
    allow_multiple_selected = True


class MultipleFileField(forms.FileField):
    """Custom field that handles multiple file uploads"""
    def __init__(self, *args, **kwargs):
        kwargs.setdefault("widget", MultipleFileInput())
        super().__init__(*args, **kwargs)

    def clean(self, data, initial=None):
        single_file_clean = super().clean
        if isinstance(data, (list, tuple)):
            result = [single_file_clean(d, initial) for d in data]
        else:
            result = [single_file_clean(data, initial)]
        return result


class BulkImageUploadForm(forms.Form):
    """Form for uploading multiple images at once"""
    images = MultipleFileField(
        required=False,
        help_text="Select multiple images to upload (hold Ctrl/Cmd to select multiple)"
    )


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
    extra = 0  # No empty rows - use bulk upload instead
    fields = ['image_preview', 'is_primary', 'sort_order', 'delete_checkbox']
    readonly_fields = ['image_preview', 'delete_checkbox']
    ordering = ['sort_order', 'created_at']
    can_delete = True
    verbose_name = "Image"
    verbose_name_plural = "Uploaded Images (use Bulk Upload above to add new images)"

    def image_preview(self, obj):
        """Show larger preview with filename"""
        url = None
        if obj.image:
            try:
                url = obj.image.url
            except Exception:
                pass
        elif obj.image_url:
            url = obj.image_url

        if url:
            # Extract filename for display
            filename = url.split('/')[-1][:30]
            return format_html(
                '<div style="display: flex; align-items: center; gap: 10px;">'
                '<img src="{}" style="height: 60px; width: 60px; object-fit: cover; border-radius: 4px;" '
                'onerror="this.alt=\'Error\'; this.style.border=\'1px solid red\'" />'
                '<span style="color: #666; font-size: 11px;">{}</span>'
                '</div>',
                url, filename
            )
        return "-"
    image_preview.short_description = "Image"

    def delete_checkbox(self, obj):
        """Visual indicator that delete checkbox is available"""
        return format_html('<span style="color: #999; font-size: 11px;">Use checkbox →</span>')
    delete_checkbox.short_description = "Delete"


class ProductVariantInline(admin.TabularInline):
    """Inline for managing product variants"""
    model = ProductVariant
    extra = 1  # One empty row for adding variants
    fields = ['size', 'color', 'color_hex', 'price', 'is_enabled', 'is_available', 'sort_order']
    readonly_fields = ['printify_variant_id', 'last_synced_at']
    ordering = ['sort_order', 'size', 'color']

    def get_readonly_fields(self, request, obj=None):
        """Make Printify fields read-only for POD products"""
        readonly = list(self.readonly_fields)
        if obj and obj.is_pod:
            # For POD products, variant data comes from Printify - make more fields read-only
            readonly.extend(['size', 'color', 'is_available'])
        return readonly


class ProductAdminForm(forms.ModelForm):
    """Custom form with bulk image upload field"""
    bulk_images = MultipleFileField(
        required=False,
        label="Upload Multiple Images",
        help_text="Select multiple images at once (hold Ctrl/Cmd). They will be added to the carousel."
    )

    class Meta:
        model = Product
        fields = '__all__'


@admin.register(Product)
class ProductAdmin(admin.ModelAdmin):
    form = ProductAdminForm
    list_display = ['name', 'price', 'category', 'fulfillment_badge', 'stripe_status', 'variant_count', 'stock_display', 'is_active', 'featured', 'image_count']
    list_filter = ['fulfillment_type', 'category', 'is_active', 'is_discontinued', 'featured', 'best_selling', 'on_sale']
    search_fields = ['name', 'description']
    prepopulated_fields = {'slug': ('name',)}
    readonly_fields = ['created_at', 'updated_at', 'stripe_product_id', 'stripe_price_id']
    inlines = [ProductImageInline, ProductVariantInline]
    actions = ['sync_variants_from_printify', 'sync_to_stripe']

    class Media:
        js = ('payments/js/product_admin.js',)

    fieldsets = (
        (None, {
            'fields': ('name', 'slug', 'description')
        }),
        ('📸 Upload Images', {
            'fields': ('bulk_images',),
            'description': '<strong>Select multiple files at once</strong> (hold Ctrl/Cmd and click). '
                           'First uploaded image becomes primary. Manage existing images in the section below.'
        }),
        ('Pricing', {
            'fields': ('price', 'compare_at_price')
        }),
        ('Fulfillment', {
            'fields': ('fulfillment_type',),
            'description': '''
                <strong>POD (Print on Demand):</strong> Products fulfilled via Printify. Set Printify IDs below.<br/>
                <strong>Local:</strong> Products delivered by coach at practice. Track inventory manually.
            '''
        }),
        ('Categorization & Status', {
            'fields': ('category', 'is_active', 'is_discontinued', 'featured', 'best_selling', 'on_sale'),
            'description': '<strong>Discontinued:</strong> Marks product as sold out. For POD products, this overrides Printify availability.'
        }),
        ('Inventory', {
            'fields': ('manage_inventory', 'stock_quantity'),
            'description': 'For POD products, set "Manage inventory" to OFF (Printify handles stock).'
        }),
        ('Printify Integration (for POD products)', {
            'fields': ('printify_product_id', 'printify_variant_id'),
            'description': 'Required for POD products. Get these IDs from your Printify dashboard.',
            'classes': ('collapse',)
        }),
        ('Stripe Integration (auto-generated)', {
            'fields': ('stripe_product_id', 'stripe_price_id'),
            'classes': ('collapse',),
            'description': 'These IDs are <strong>auto-generated</strong> when you save a local product. '
                           'For POD products, checkout creates prices dynamically.'
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

    def fulfillment_badge(self, obj):
        """Display a colored badge for fulfillment type"""
        if obj.is_pod:
            return format_html(
                '<span style="background: #7c3aed; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px;">POD</span>'
            )
        return format_html(
            '<span style="background: #059669; color: white; padding: 3px 8px; border-radius: 4px; font-size: 11px;">Local</span>'
        )
    fulfillment_badge.short_description = "Fulfillment"
    fulfillment_badge.admin_order_field = "fulfillment_type"

    def stock_display(self, obj):
        """Display stock status with visual indicator"""
        if obj.is_discontinued:
            return format_html('<span style="color: #dc2626;">⛔ Discontinued</span>')
        if obj.is_pod:
            return format_html('<span style="color: #7c3aed;">∞ POD</span>')
        if not obj.manage_inventory:
            return format_html('<span style="color: #059669;">∞ In Stock</span>')
        if obj.stock_quantity <= 0:
            return format_html('<span style="color: #dc2626;">Out of Stock</span>')
        if obj.stock_quantity <= 5:
            return format_html('<span style="color: #f59e0b;">{} left</span>', obj.stock_quantity)
        return format_html('<span style="color: #059669;">{}</span>', obj.stock_quantity)
    stock_display.short_description = "Stock"
    stock_display.admin_order_field = "stock_quantity"

    def image_count(self, obj):
        count = obj.images.count()
        return count if count > 0 else '-'
    image_count.short_description = "Images"

    def variant_count(self, obj):
        """Display variant count with enabled/total breakdown"""
        enabled = obj.variants.filter(is_enabled=True).count()
        total = obj.variants.count()
        if total == 0:
            return '-'
        if enabled == total:
            return format_html('<span style="color: #059669;">{}</span>', total)
        return format_html('<span>{}/{}</span>', enabled, total)
    variant_count.short_description = "Variants"

    def stripe_status(self, obj):
        """Display Stripe sync status"""
        if obj.is_pod:
            return format_html('<span style="color: #9ca3af;">N/A</span>')
        if obj.stripe_product_id and obj.stripe_price_id:
            return format_html('<span style="color: #059669;">✓ Synced</span>')
        if obj.stripe_product_id:
            return format_html('<span style="color: #f59e0b;">⚠ No price</span>')
        return format_html('<span style="color: #9ca3af;">—</span>')
    stripe_status.short_description = "Stripe"

    @admin.action(description="Sync selected products to Stripe")
    def sync_to_stripe(self, request, queryset):
        """Manually sync selected products to Stripe"""
        synced = 0
        skipped = 0
        errors = []

        for product in queryset:
            if product.is_pod:
                skipped += 1
                continue
            try:
                product._sync_to_stripe()
                product.save(update_fields=['stripe_product_id', 'stripe_price_id'])
                synced += 1
            except Exception as e:
                errors.append(f"{product.name}: {str(e)[:50]}")

        if synced:
            self.message_user(request, f"Synced {synced} product(s) to Stripe")
        if skipped:
            self.message_user(request, f"Skipped {skipped} POD product(s)", level='warning')
        if errors:
            self.message_user(request, f"Errors: {'; '.join(errors[:3])}", level='error')

    @admin.action(description="Sync variants from Printify")
    def sync_variants_from_printify(self, request, queryset):
        """Admin action to sync variants from Printify for selected POD products"""
        from .services import sync_product_variants

        synced = 0
        skipped = 0
        errors = []

        for product in queryset:
            if not product.is_pod:
                skipped += 1
                continue
            if not product.printify_product_id:
                errors.append(f"{product.name}: No Printify product ID")
                continue

            stats = sync_product_variants(product)
            if stats['errors']:
                errors.extend([f"{product.name}: {e}" for e in stats['errors']])
            else:
                synced += 1

        # Build result message
        messages = []
        if synced:
            messages.append(f"Synced variants for {synced} product(s)")
        if skipped:
            messages.append(f"Skipped {skipped} non-POD product(s)")
        if errors:
            messages.append(f"Errors: {'; '.join(errors[:3])}")  # Show first 3 errors

        if synced and not errors:
            self.message_user(request, ". ".join(messages))
        elif errors:
            self.message_user(request, ". ".join(messages), level='warning')
        else:
            self.message_user(request, "No POD products with Printify IDs to sync", level='warning')

    def save_model(self, request, obj, form, change):
        """Save the product first, then handle bulk image uploads"""
        super().save_model(request, obj, form, change)

        # Handle bulk image uploads
        bulk_images = request.FILES.getlist('bulk_images')
        if bulk_images:
            # Get the current max sort order
            max_order = obj.images.aggregate(
                max_order=models.Max('sort_order')
            )['max_order'] or -1

            for i, image_file in enumerate(bulk_images):
                ProductImage.objects.create(
                    product=obj,
                    image=image_file,
                    alt_text=f"{obj.name} - Image {max_order + i + 2}",
                    sort_order=max_order + i + 1,
                    is_primary=(max_order == -1 and i == 0)  # First image is primary if no images exist
                )


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


class BagItemInline(admin.TabularInline):
    model = BagItem
    extra = 0
    readonly_fields = ['total_price', 'added_at']


@admin.register(Bag)
class BagAdmin(admin.ModelAdmin):
    list_display = ['id', 'user', 'session_key_short', 'item_count', 'subtotal', 'updated_at']
    list_filter = ['updated_at']
    search_fields = ['user__email', 'session_key']
    readonly_fields = ['created_at', 'updated_at', 'item_count', 'subtotal']
    inlines = [BagItemInline]

    def session_key_short(self, obj):
        if obj.session_key:
            return f"{obj.session_key[:8]}..."
        return "-"
    session_key_short.short_description = "Session Key"
