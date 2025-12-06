from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.contenttypes.fields import GenericForeignKey
from django.contrib.contenttypes.models import ContentType
from django.utils.text import slugify
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

    # Media
    image_url = models.URLField(max_length=500, blank=True)

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
