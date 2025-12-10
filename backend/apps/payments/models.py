from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.text import slugify
from django.utils import timezone
from datetime import timedelta
import secrets

User = get_user_model()


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
    """Products (merch) with Printify integration for Phase 2"""

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

    # Stripe
    stripe_price_id = models.CharField(max_length=255, blank=True)
    stripe_product_id = models.CharField(max_length=255, blank=True)

    # Print-on-Demand integration (Phase 2 - Printify)
    printify_product_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Product ID (Phase 2)"
    )
    printify_variant_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Variant ID (Phase 2)"
    )

    # Inventory management (simple for MVP, Printify sync in Phase 2)
    manage_inventory = models.BooleanField(default=True, help_text="Track inventory locally")
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
        super().save(*args, **kwargs)

    def __str__(self):
        return self.name

    @property
    def in_stock(self):
        """Check if product is in stock"""
        if not self.manage_inventory:
            return True
        return self.stock_quantity > 0

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
        super().save(*args, **kwargs)


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

    # Quantity
    quantity = models.IntegerField(default=1)

    # Print-on-Demand tracking (Phase 2)
    printify_line_item_id = models.CharField(
        max_length=100,
        blank=True,
        help_text="Printify Line Item ID (Phase 2)"
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
    def total_price(self):
        """Calculate total price for this bag item"""
        return self.product.price * self.quantity

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
