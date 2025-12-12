from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta
import secrets
import stripe
import logging

logger = logging.getLogger(__name__)

User = get_user_model()

# Fulfillment type choices (module-level for reuse across models)
FULFILLMENT_TYPE_CHOICES = [
    ('pod', 'Print on Demand (Printify)'),
    ('local', 'Local/Vendor (Coach Delivery)'),
]


class SubscriptionPlan(models.Model):
    """Subscription plans for recurring memberships

    Typical Bergen County AAU Basketball Pricing (2024-2025):
    - Monthly: $175/month (flexible, month-to-month)
    - Seasonal: $475 for 3-month season (save $50 vs monthly)
    - Annual: $1,800/year (save $300 vs monthly)
    - Team Dues (one-time): $950 per season (secures team spot, must pay by deadline)
    """

    name = models.CharField(max_length=100)
    slug = models.SlugField(max_length=100, unique=True, blank=True)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    billing_period = models.CharField(
        max_length=20,
        choices=[
            ('monthly', 'Monthly'),
            ('seasonal', 'Seasonal'),
            ('annual', 'Annual'),
            ('one_time', 'One-Time (Team Dues)'),
        ]
    )

    # For team dues payment option
    is_team_dues = models.BooleanField(
        default=False,
        help_text="One-time season payment to secure team spot"
    )
    payment_deadline = models.DateField(
        null=True,
        blank=True,
        help_text="Deadline for team dues payment"
    )

    # Stripe integration
    stripe_price_id = models.CharField(max_length=255, help_text="Stripe Price ID")
    stripe_product_id = models.CharField(max_length=255, help_text="Stripe Product ID")

    # Features
    features = models.JSONField(default=list, help_text="List of plan features")
    is_active = models.BooleanField(default=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['price']

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)
        super().save(*args, **kwargs)

    def __str__(self):
        return f"{self.name} - ${self.price}/{self.billing_period}"


class Subscription(models.Model):
    """User subscriptions tracking"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='subscriptions')
    plan = models.ForeignKey(SubscriptionPlan, on_delete=models.PROTECT)

    # Stripe tracking
    stripe_subscription_id = models.CharField(max_length=255, unique=True)
    stripe_customer_id = models.CharField(max_length=255)

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('active', 'Active'),
            ('canceled', 'Canceled'),
            ('past_due', 'Past Due'),
            ('trialing', 'Trialing'),
            ('incomplete', 'Incomplete'),
        ]
    )

    # Billing period
    current_period_start = models.DateTimeField()
    current_period_end = models.DateTimeField()
    cancel_at_period_end = models.BooleanField(default=False)
    canceled_at = models.DateTimeField(null=True, blank=True)

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['stripe_subscription_id']),
        ]

    def __str__(self):
        return f"{self.user.email} - {self.plan.name} ({self.status})"


class Payment(models.Model):
    """Generic payment tracking for all payment types"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='payments')

    # Amount
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    currency = models.CharField(max_length=3, default='usd')

    # Stripe tracking
    stripe_payment_intent_id = models.CharField(max_length=255, unique=True)
    stripe_charge_id = models.CharField(max_length=255, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('succeeded', 'Succeeded'),
            ('failed', 'Failed'),
            ('refunded', 'Refunded'),
        ]
    )
    payment_method = models.CharField(max_length=50, blank=True)

    # Link to what was purchased (generic relation)
    content_type = models.ForeignKey(ContentType, on_delete=models.CASCADE, null=True)
    object_id = models.PositiveIntegerField(null=True)
    content_object = GenericForeignKey('content_type', 'object_id')

    # Metadata
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['stripe_payment_intent_id']),
        ]

    def __str__(self):
        return f"{self.user.email} - ${self.amount} ({self.status})"


class Product(models.Model):
    """Products (merch) with Printify integration for POD and local vendor products"""

    name = models.CharField(max_length=200)
    slug = models.SlugField(max_length=200, unique=True, blank=True)
    description = models.TextField()

    # Pricing
    price = models.DecimalField(max_digits=10, decimal_places=2)
    compare_at_price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Original price for showing discounts"
    )

    # Fulfillment type - determines how product is fulfilled
    fulfillment_type = models.CharField(
        max_length=20,
        choices=FULFILLMENT_TYPE_CHOICES,
        default='local',
        help_text="How this product is fulfilled: POD via Printify or local coach delivery"
    )

    # Stripe
    stripe_price_id = models.CharField(max_length=255, blank=True)
    stripe_product_id = models.CharField(max_length=255, blank=True)

    # Print-on-Demand integration (Printify) - used when fulfillment_type='pod'
    printify_product_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Product ID - required for POD products"
    )
    printify_variant_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Variant ID - required for POD products"
    )

    # Inventory management - POD products should set manage_inventory=False
    manage_inventory = models.BooleanField(
        default=True,
        help_text="Track inventory locally. Set False for POD products (always in stock)"
    )
    stock_quantity = models.IntegerField(default=0)

    # Categorization
    category = models.CharField(
        max_length=50,
        choices=[
            ('jersey', 'Jersey'),
            ('apparel', 'Apparel'),
            ('accessories', 'Accessories'),
            ('equipment', 'Equipment'),
        ]
    )

    # Media (legacy single image - kept for backwards compatibility)
    image_url = models.URLField(max_length=500, blank=True, help_text="Legacy single image URL")

    # Status
    is_active = models.BooleanField(default=True)
    is_discontinued = models.BooleanField(
        default=False,
        help_text="Mark product as discontinued/sold out (admin override for POD products)"
    )
    featured = models.BooleanField(default=False, help_text="Show in featured products section")
    best_selling = models.BooleanField(default=False, help_text="Mark as bestseller")
    on_sale = models.BooleanField(default=False, help_text="Show 'On Sale' badge")

    # Metadata
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['name']
        indexes = [
            models.Index(fields=['category', 'is_active']),
            models.Index(fields=['featured', 'is_active']),
            models.Index(fields=['best_selling', 'is_active']),
            models.Index(fields=['on_sale', 'is_active']),
        ]

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = slugify(self.name)

        # POD products should never track inventory (they're made to order)
        if self.fulfillment_type == 'pod':
            self.manage_inventory = False

        # Auto-create Stripe product/price for local products
        if self.is_local and self.is_active and self.price:
            self._sync_to_stripe()

        super().save(*args, **kwargs)

    def _sync_to_stripe(self):
        """Create or update Stripe product and price"""
        from django.conf import settings

        # Skip if Stripe isn't configured
        if not getattr(settings, 'STRIPE_SECRET_KEY', None):
            return

        try:
            stripe.api_key = settings.STRIPE_SECRET_KEY
            price_cents = int(self.price * 100)

            # Create or update Stripe Product
            if self.stripe_product_id:
                # Update existing product
                stripe.Product.modify(
                    self.stripe_product_id,
                    name=self.name,
                    description=self.description[:500] if self.description else None,
                    active=self.is_active,
                )
            else:
                # Create new product
                stripe_product = stripe.Product.create(
                    name=self.name,
                    description=self.description[:500] if self.description else None,
                    metadata={'django_product_id': str(self.pk) if self.pk else 'new'},
                )
                self.stripe_product_id = stripe_product.id

            # Create new price if needed (Stripe prices are immutable)
            # Only create if no price exists OR if price changed
            should_create_price = False
            if not self.stripe_price_id:
                should_create_price = True
            else:
                # Check if existing price matches
                try:
                    existing_price = stripe.Price.retrieve(self.stripe_price_id)
                    if existing_price.unit_amount != price_cents:
                        # Price changed - archive old, create new
                        stripe.Price.modify(self.stripe_price_id, active=False)
                        should_create_price = True
                except stripe.error.InvalidRequestError:
                    should_create_price = True

            if should_create_price and self.stripe_product_id:
                stripe_price = stripe.Price.create(
                    product=self.stripe_product_id,
                    unit_amount=price_cents,
                    currency='usd',
                )
                self.stripe_price_id = stripe_price.id

            logger.info(f"Synced product '{self.name}' to Stripe: {self.stripe_product_id}")

        except stripe.error.StripeError as e:
            logger.warning(f"Stripe sync failed for product '{self.name}': {e}")
            # Don't raise - allow save to continue even if Stripe fails

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        """
        Check if product is in stock.

        For POD products: Always in stock unless admin marks as discontinued.
        For local products: Check stock_quantity if inventory is managed.
        """
        # Admin can discontinue any product
        if self.is_discontinued:
            return False

        # POD products are always in stock (Printify handles availability per-variant)
        if self.is_pod:
            return True

        # Local products with managed inventory check stock_quantity
        if self.manage_inventory:
            return self.stock_quantity > 0

        # Default: in stock
        return True

    @property
    def is_pod(self):
        """Check if product is fulfilled via Print on Demand (Printify)"""
        return self.fulfillment_type == 'pod'

    @property
    def is_local(self):
        """Check if product is fulfilled locally (coach delivery)"""
        return self.fulfillment_type == 'local'

    @property
    def shipping_estimate(self):
        """Get estimated shipping time based on fulfillment type"""
        if self.is_pod:
            return "5-10 business days"
        return "Coach delivery at next practice"

    @property
    def fulfillment_display(self):
        """Human-readable fulfillment type for frontend display"""
        if self.is_pod:
            return "Made to Order"
        return "Coach Delivery"

    @property
    def primary_image_url(self):
        """Get the primary image URL (from carousel images or legacy image_url)"""
        primary = self.images.filter(is_primary=True).first()
        if primary:
            return primary.url  # Uses the url property which handles both upload and URL
        first_image = self.images.first()
        if first_image:
            return first_image.url
        return self.image_url or None


def product_image_path(instance, filename):
    """Generate upload path for product images: products/<product_id>/<filename>"""
    return f'products/{instance.product.id}/{filename}'


class ProductImage(models.Model):
    """Multiple images for a product - supports both file uploads and URLs"""

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='images'
    )
    # Option 1: Upload an image file
    image = models.ImageField(
        upload_to=product_image_path,
        blank=True,
        null=True,
        help_text="Upload an image file (recommended: 800x800px or larger)"
    )
    # Option 2: Provide an image URL
    image_url = models.URLField(
        max_length=500,
        blank=True,
        help_text="Or paste an image URL (e.g., from Unsplash)"
    )
    # Printify sync tracking - stores the original Printify image src
    printify_src = models.URLField(
        max_length=500,
        blank=True,
        null=True,
        help_text="Original Printify mockup URL (set by sync, do not edit)"
    )
    # Printify variant IDs this image is associated with (for filtering by color)
    printify_variant_ids = models.JSONField(
        default=list,
        blank=True,
        help_text="List of Printify variant IDs this image shows (set by sync)"
    )
    alt_text = models.CharField(
        max_length=200,
        blank=True,
        help_text="Alt text for accessibility"
    )
    is_primary = models.BooleanField(
        default=False,
        help_text="Set as the main product image"
    )
    sort_order = models.PositiveIntegerField(
        default=0,
        help_text="Order in the carousel (lower = first)"
    )
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['sort_order', 'created_at']
        indexes = [
            models.Index(fields=['product', 'sort_order']),
        ]

    def __str__(self):
        return f"{self.product.name} - Image {self.sort_order + 1}"

    @property
    def url(self):
        """Return the image URL - prefers uploaded file, falls back to URL"""
        if self.image:
            return self.image.url
        return self.image_url or None

    def clean(self):
        """Validate that at least one image source is provided"""
        from django.core.exceptions import ValidationError
        if not self.image and not self.image_url:
            raise ValidationError("Please provide either an uploaded image or an image URL.")

    def save(self, *args, **kwargs):
        # If this is marked as primary, unmark others
        if self.is_primary:
            ProductImage.objects.filter(
                product=self.product, is_primary=True
            ).exclude(pk=self.pk).update(is_primary=False)

        # Auto-set as primary if no primary image exists for this product
        if not self.is_primary and self.product_id:
            has_primary = ProductImage.objects.filter(
                product_id=self.product_id, is_primary=True
            ).exclude(pk=self.pk).exists()
            if not has_primary:
                self.is_primary = True

        super().save(*args, **kwargs)


class ProductVariant(models.Model):
    """
    Variants for a product - synced from Printify for POD products,
    or manually configured for local products.
    """

    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='variants'
    )

    # Printify identifiers (null for local products)
    printify_variant_id = models.IntegerField(
        null=True,
        blank=True,
        help_text="Printify variant ID - required for POD products"
    )

    # Display info (auto-generated from color/size if blank)
    title = models.CharField(
        max_length=255,
        blank=True,
        help_text="Auto-generated from color/size if left blank"
    )

    # Variant options (parsed from Printify or manually entered)
    size = models.CharField(max_length=50, blank=True, db_index=True)
    color = models.CharField(max_length=50, blank=True, db_index=True)
    color_hex = models.CharField(
        max_length=7,
        blank=True,
        help_text="Hex color code for UI display (e.g., '#1a1a1a')"
    )

    # Pricing - variant-specific price if different from base
    price = models.DecimalField(
        max_digits=10,
        decimal_places=2,
        null=True,
        blank=True,
        help_text="Variant-specific price (leave blank to use product base price)"
    )

    # Availability
    is_enabled = models.BooleanField(
        default=True,
        help_text="Whether this variant is available for purchase"
    )
    is_available = models.BooleanField(
        default=True,
        help_text="Stock availability (for POD, this comes from Printify)"
    )

    # Ordering
    sort_order = models.PositiveIntegerField(default=0)

    # Sync tracking
    last_synced_at = models.DateTimeField(
        null=True,
        blank=True,
        help_text="Last sync from Printify"
    )

    # Timestamps
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['sort_order', 'size', 'color']
        unique_together = [['product', 'printify_variant_id']]
        indexes = [
            models.Index(fields=['product', 'is_enabled']),
            models.Index(fields=['product', 'size']),
            models.Index(fields=['product', 'color']),
        ]

    def __str__(self):
        return f"{self.product.name} - {self.title}"

    def save(self, *args, **kwargs):
        # Auto-generate title from color and size if not provided
        if not self.title or self.title.strip() == '':
            parts = []
            if self.color:
                parts.append(self.color)
            if self.size:
                parts.append(self.size)
            self.title = ' / '.join(parts) if parts else 'Default'
        super().save(*args, **kwargs)

    @property
    def effective_price(self):
        """Return variant price or fall back to product base price"""
        return self.price if self.price is not None else self.product.price


class Order(models.Model):
    """Orders for products"""

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='orders')

    # Order details
    order_number = models.CharField(max_length=50, unique=True, blank=True)

    # Stripe
    stripe_session_id = models.CharField(max_length=255, blank=True)
    stripe_payment_intent_id = models.CharField(max_length=255, blank=True)

    # Status
    status = models.CharField(
        max_length=20,
        choices=[
            ('pending', 'Pending'),
            ('paid', 'Paid'),
            ('processing', 'Processing'),
            ('shipped', 'Shipped'),
            ('delivered', 'Delivered'),
            ('canceled', 'Canceled'),
            ('refunded', 'Refunded'),
        ],
        default='pending'
    )

    # Amounts
    subtotal = models.DecimalField(max_digits=10, decimal_places=2)
    shipping = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total = models.DecimalField(max_digits=10, decimal_places=2)

    # Shipping info
    shipping_name = models.CharField(max_length=200)
    shipping_email = models.EmailField()
    shipping_address_line1 = models.CharField(max_length=255)
    shipping_address_line2 = models.CharField(max_length=255, blank=True)
    shipping_city = models.CharField(max_length=100)
    shipping_state = models.CharField(max_length=100)
    shipping_zip = models.CharField(max_length=20)
    shipping_country = models.CharField(max_length=100, default='US')

    # Shipping tracking (Printify integration in Phase 2)
    printify_order_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Order ID (Phase 2)"
    )
    tracking_number = models.CharField(max_length=255, blank=True)
    tracking_url = models.URLField(max_length=500, blank=True)

    # Metadata
    notes = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['-created_at']
        indexes = [
            models.Index(fields=['user', 'status']),
            models.Index(fields=['order_number']),
        ]

    def save(self, *args, **kwargs):
        if not self.order_number:
            # Generate unique order number
            self.order_number = f"NJS-{secrets.token_hex(4).upper()}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Order {self.order_number} - {self.user.email}"


class OrderItem(models.Model):
    """Items in an order"""

    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items')
    product = models.ForeignKey(Product, on_delete=models.PROTECT)

    # Product snapshot at time of purchase
    product_name = models.CharField(max_length=200)
    product_price = models.DecimalField(max_digits=10, decimal_places=2)

    # Variant selections
    selected_size = models.CharField(max_length=50, blank=True)
    selected_color = models.CharField(max_length=50, blank=True)

    # Quantity
    quantity = models.IntegerField(default=1)

    # Fulfillment type snapshot (matches product at time of purchase)
    fulfillment_type = models.CharField(
        max_length=20,
        choices=FULFILLMENT_TYPE_CHOICES,
        default='local',
        help_text="Fulfillment type at time of purchase"
    )

    # Print-on-Demand tracking
    printify_line_item_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Line Item ID for POD products"
    )

    class Meta:
        ordering = ['id']

    def __str__(self):
        return f"{self.quantity}x {self.product_name}"

    @property
    def total_price(self):
        """Calculate total price for this line item"""
        return self.product_price * self.quantity


class Bag(models.Model):
    """Shopping bag for users and guests

    Authenticated users: bag persisted in DB, linked to user
    Guest users: bag tracked by session_key, can be merged on login
    """

    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='bag',
        null=True,
        blank=True,
        help_text="Authenticated user's bag"
    )
    session_key = models.CharField(
        max_length=40,
        null=True,
        blank=True,
        db_index=True,
        help_text="Session key for guest bags"
    )

    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        db_table = 'payments_cart'  # Keep existing table name to avoid data migration
        constraints = [
            # Ensure bag has either user OR session_key, not both empty
            models.CheckConstraint(
                check=models.Q(user__isnull=False) | models.Q(session_key__isnull=False),
                name='cart_must_have_owner'
            ),
        ]
        indexes = [
            models.Index(fields=['session_key']),
            models.Index(fields=['updated_at']),
        ]

    def __str__(self):
        if self.user:
            return f"Bag for {self.user.email}"
        return f"Guest Bag ({self.session_key[:8]}...)"

    @property
    def item_count(self):
        """Total number of items in bag"""
        return sum(item.quantity for item in self.items.all())

    @property
    def subtotal(self):
        """Calculate bag subtotal"""
        return sum(item.total_price for item in self.items.all())

    def merge_from_guest_bag(self, guest_bag):
        """Merge items from a guest bag into this user bag

        Called when a guest user logs in and has items in their bag.
        Items with same product+variants are merged (quantities added).
        Items with different variants are created as separate items.
        """
        for guest_item in guest_bag.items.all():
            existing_item = self.items.filter(
                product=guest_item.product,
                selected_size=guest_item.selected_size,
                selected_color=guest_item.selected_color
            ).first()
            if existing_item:
                existing_item.quantity += guest_item.quantity
                existing_item.save()
            else:
                BagItem.objects.create(
                    bag=self,
                    product=guest_item.product,
                    quantity=guest_item.quantity,
                    selected_size=guest_item.selected_size,
                    selected_color=guest_item.selected_color
                )
        guest_bag.delete()

    def clear(self):
        """Remove all items from bag"""
        self.items.all().delete()

    @classmethod
    def cleanup_expired_guest_bags(cls, days=7):
        """Remove guest bags that haven't been updated in X days"""
        cutoff = timezone.now() - timedelta(days=days)
        expired = cls.objects.filter(
            user__isnull=True,
            updated_at__lt=cutoff
        )
        count = expired.count()
        expired.delete()
        return count


class BagItem(models.Model):
    """Individual items in a shopping bag"""

    bag = models.ForeignKey(
        Bag,
        on_delete=models.CASCADE,
        related_name='items'
    )
    product = models.ForeignKey(
        Product,
        on_delete=models.CASCADE,
        related_name='bag_items'
    )
    quantity = models.PositiveIntegerField(default=1)
    selected_size = models.CharField(
        max_length=20,
        blank=True,
        null=True,
        help_text="Selected size variant (e.g., S, M, L, XL)"
    )
    selected_color = models.CharField(
        max_length=50,
        blank=True,
        null=True,
        help_text="Selected color variant (e.g., Black, Navy)"
    )
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        db_table = 'payments_cartitem'  # Keep existing table name to avoid data migration
        # Same product with different variants = different bag items
        unique_together = ['bag', 'product', 'selected_size', 'selected_color']
        ordering = ['-added_at']

    def __str__(self):
        parts = [f"{self.quantity}x {self.product.name}"]
        if self.selected_size:
            parts.append(f"Size: {self.selected_size}")
        if self.selected_color:
            parts.append(f"Color: {self.selected_color}")
        return " - ".join(parts)

    @property
    def unit_price(self):
        """Get the correct price for this item (variant price or base product price)"""
        # Look up variant by size/color if selected
        if self.selected_size or self.selected_color:
            variant = self.product.variants.filter(
                size=self.selected_size or '',
                color=self.selected_color or '',
                is_enabled=True
            ).first()
            if variant and variant.price:
                return variant.price
        # Fall back to product base price
        return self.product.price

    @property
    def total_price(self):
        """Calculate total price for this bag item"""
        return self.unit_price * self.quantity

    @property
    def is_available(self):
        """Check if product is still available and in stock"""
        if not self.product.is_active:
            return False
        return self.product.in_stock

    def save(self, *args, **kwargs):
        # Update bag's updated_at timestamp
        super().save(*args, **kwargs)
        Bag.objects.filter(pk=self.bag_id).update(updated_at=timezone.now())
