from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant, SubscriptionPlan, Bag, BagItem, Order, OrderItem, MerchDropSettings


class ProductImageSerializer(serializers.ModelSerializer):
    """Serializer for ProductImage model"""

    url = serializers.SerializerMethodField()

    class Meta:
        model = ProductImage
        fields = [
            'id',
            'url',
            'alt_text',
            'is_primary',
            'sort_order',
            'printify_variant_ids',
        ]

    def get_url(self, obj):
        """Return the image URL - handles both uploads and URL links"""
        request = self.context.get('request')
        # If uploaded file exists, return its URL
        if obj.image:
            if request:
                return request.build_absolute_uri(obj.image.url)
            return obj.image.url
        # Otherwise return the image_url field
        return obj.image_url or None


class ProductVariantSerializer(serializers.ModelSerializer):
    """Serializer for ProductVariant model"""

    effective_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = ProductVariant
        fields = [
            'id',
            'printify_variant_id',
            'title',
            'size',
            'color',
            'color_hex',
            'price',
            'effective_price',
            'is_enabled',
            'is_available',
            'sort_order',
        ]
        read_only_fields = ['id', 'printify_variant_id']


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model with fulfillment type support"""

    in_stock = serializers.ReadOnlyField()
    is_pod = serializers.ReadOnlyField()
    is_local = serializers.ReadOnlyField()
    shipping_estimate = serializers.ReadOnlyField()
    fulfillment_display = serializers.ReadOnlyField()
    primary_image_url = serializers.SerializerMethodField()
    images = serializers.SerializerMethodField()
    # Variant data
    variants = serializers.SerializerMethodField()
    available_sizes = serializers.SerializerMethodField()
    available_colors = serializers.SerializerMethodField()

    def get_variants(self, obj):
        """Serialize enabled and available variants"""
        variants = obj.variants.filter(is_enabled=True, is_available=True)
        return ProductVariantSerializer(variants, many=True).data

    def get_available_sizes(self, obj):
        """Get unique available sizes for this product"""
        sizes = obj.variants.filter(
            is_enabled=True, is_available=True
        ).exclude(size='').values_list('size', flat=True).distinct()
        # Preserve order from sort_order rather than alphabetical
        ordered_sizes = obj.variants.filter(
            is_enabled=True, is_available=True, size__in=sizes
        ).order_by('sort_order').values_list('size', flat=True)
        # Remove duplicates while preserving order
        seen = set()
        return [s for s in ordered_sizes if not (s in seen or seen.add(s))]

    def get_available_colors(self, obj):
        """Get unique available colors with hex codes"""
        colors = obj.variants.filter(
            is_enabled=True, is_available=True
        ).exclude(color='').values('color', 'color_hex')
        # Deduplicate by color name (keep first occurrence)
        seen = set()
        unique_colors = []
        for c in colors:
            if c['color'] not in seen:
                seen.add(c['color'])
                unique_colors.append({'name': c['color'], 'hex': c['color_hex']})
        return unique_colors

    def get_images(self, obj):
        """Serialize images with request context for absolute URLs"""
        request = self.context.get('request')
        serializer = ProductImageSerializer(
            obj.images.all(),
            many=True,
            context={'request': request}
        )
        return serializer.data

    def get_primary_image_url(self, obj):
        """Get the primary image URL with absolute URL for uploaded files"""
        request = self.context.get('request')
        primary = obj.images.filter(is_primary=True).first()
        image_obj = primary or obj.images.first()

        if image_obj:
            if image_obj.image:
                if request:
                    return request.build_absolute_uri(image_obj.image.url)
                return image_obj.image.url
            return image_obj.image_url

        return obj.image_url or None

    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'price',
            'compare_at_price',
            'category',
            # Fulfillment fields
            'fulfillment_type',
            'is_pod',
            'is_local',
            'shipping_estimate',
            'fulfillment_display',
            # Images
            'image_url',
            'primary_image_url',
            'images',
            # Variants
            'variants',
            'available_sizes',
            'available_colors',
            # Status
            'is_active',
            'featured',
            'best_selling',
            'on_sale',
            'stock_quantity',
            'in_stock',
            # Timestamps
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class SubscriptionPlanSerializer(serializers.ModelSerializer):
    """Serializer for SubscriptionPlan model"""

    class Meta:
        model = SubscriptionPlan
        fields = [
            'id',
            'name',
            'slug',
            'description',
            'price',
            'billing_period',
            'is_team_dues',
            'payment_deadline',
            'features',
            'is_active',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class BagItemSerializer(serializers.ModelSerializer):
    """Serializer for bag items with nested product data"""

    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    unit_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = BagItem
        fields = [
            'id',
            'product',
            'product_id',
            'quantity',
            'selected_size',
            'selected_color',
            'unit_price',
            'total_price',
            'is_available',
            'added_at',
        ]
        read_only_fields = ['id', 'added_at']

    def validate_product_id(self, value):
        """Ensure product exists and is active"""
        try:
            product = Product.objects.get(pk=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or unavailable.")
        return value

    def validate_quantity(self, value):
        """Ensure quantity is positive"""
        if value < 1:
            raise serializers.ValidationError("Quantity must be at least 1.")
        return value


class BagSerializer(serializers.ModelSerializer):
    """Serializer for shopping bag with nested items"""

    items = BagItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Bag
        fields = [
            'id',
            'items',
            'item_count',
            'subtotal',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AddToBagSerializer(serializers.Serializer):
    """Serializer for adding items to bag"""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)
    selected_size = serializers.CharField(required=False, allow_null=True, allow_blank=True)
    selected_color = serializers.CharField(required=False, allow_null=True, allow_blank=True)

    def validate_product_id(self, value):
        """Ensure product exists, is active, and in stock"""
        try:
            product = Product.objects.get(pk=value, is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError("Product not found or unavailable.")

        if not product.in_stock:
            raise serializers.ValidationError("Product is out of stock.")

        return value

    def validate(self, data):
        """Check stock quantity if inventory is managed"""
        product = Product.objects.get(pk=data['product_id'])
        if product.manage_inventory:
            if data['quantity'] > product.stock_quantity:
                raise serializers.ValidationError({
                    'quantity': f"Only {product.stock_quantity} items available."
                })
        return data


class UpdateBagItemSerializer(serializers.Serializer):
    """Serializer for updating bag item quantity"""

    quantity = serializers.IntegerField(min_value=0)

    def validate_quantity(self, value):
        """Quantity of 0 means remove item"""
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items with fulfillment info"""

    product_image = serializers.SerializerMethodField()
    fulfillment_display = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_name',
            'product_price',
            'selected_size',
            'selected_color',
            'quantity',
            'total_price',
            'product_image',
            'fulfillment_type',
            'fulfillment_display',
            'printify_line_item_id',
        ]
        read_only_fields = ['id']

    def get_product_image(self, obj):
        """Get product image URL if product still exists"""
        if obj.product:
            return obj.product.primary_image_url
        return None

    def get_fulfillment_display(self, obj):
        """Get human-readable fulfillment type"""
        if obj.fulfillment_type == 'pod':
            return 'Made to Order'
        return 'Coach Delivery'


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model with tracking support"""

    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.SerializerMethodField()
    has_tracking = serializers.SerializerMethodField()
    has_pod_items = serializers.SerializerMethodField()
    has_local_items = serializers.SerializerMethodField()

    class Meta:
        model = Order
        fields = [
            'id',
            'order_number',
            'status',
            'status_display',
            'subtotal',
            'shipping',
            'tax',
            'total',
            # Shipping address
            'shipping_name',
            'shipping_email',
            'shipping_address_line1',
            'shipping_address_line2',
            'shipping_city',
            'shipping_state',
            'shipping_zip',
            'shipping_country',
            # Tracking info
            'tracking_number',
            'tracking_url',
            'has_tracking',
            # Printify info
            'printify_order_id',
            'has_pod_items',
            'has_local_items',
            # Items and timestamps
            'items',
            'notes',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_status_display(self, obj):
        """Return human-readable status"""
        return obj.get_status_display()

    def get_has_tracking(self, obj):
        """Check if order has tracking information"""
        return bool(obj.tracking_number and obj.tracking_url)

    def get_has_pod_items(self, obj):
        """Check if order contains POD items"""
        return obj.items.filter(product__fulfillment_type='pod').exists()

    def get_has_local_items(self, obj):
        """Check if order contains local delivery items"""
        return obj.items.filter(product__fulfillment_type='local').exists()


class HandoffItemSerializer(serializers.ModelSerializer):
    """Serializer for local delivery items pending handoff"""

    order_number = serializers.CharField(source='order.order_number', read_only=True)
    order_date = serializers.DateTimeField(source='order.created_at', read_only=True)
    customer_name = serializers.CharField(source='order.shipping_name', read_only=True)
    customer_email = serializers.CharField(source='order.shipping_email', read_only=True)
    handoff_completed_by_name = serializers.SerializerMethodField()

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'order_number',
            'order_date',
            'customer_name',
            'customer_email',
            'product_name',
            'selected_size',
            'selected_color',
            'quantity',
            'handoff_status',
            'handoff_completed_at',
            'handoff_completed_by_name',
            'handoff_notes',
        ]

    def get_handoff_completed_by_name(self, obj):
        """Get the name of staff who completed the handoff"""
        if obj.handoff_completed_by:
            return obj.handoff_completed_by.get_full_name() or obj.handoff_completed_by.username
        return None


class HandoffUpdateSerializer(serializers.Serializer):
    """Serializer for updating handoff status"""

    status = serializers.ChoiceField(
        choices=['pending', 'ready', 'delivered'],
        help_text="New handoff status"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Optional notes about the handoff"
    )


# ============================================================================
# Cash Payment Serializers
# ============================================================================

from .models import CashPayment


class CashPaymentSerializer(serializers.ModelSerializer):
    """Serializer for CashPayment model with related item info"""

    collected_by_name = serializers.SerializerMethodField()
    handed_off_to_name = serializers.SerializerMethodField()
    linked_item_description = serializers.ReadOnlyField()
    status_display = serializers.SerializerMethodField()

    class Meta:
        model = CashPayment
        fields = [
            "id",
            "collected_by",
            "collected_by_name",
            "collected_at",
            "payment_for",
            "event_registration",
            "order",
            "dues_account",
            "linked_item_description",
            "amount",
            "status",
            "status_display",
            "handed_off_to",
            "handed_off_to_name",
            "handed_off_at",
            "event",
            "notes",
            "created_at",
            "updated_at",
        ]
        read_only_fields = ["id", "collected_at", "created_at", "updated_at"]

    def get_collected_by_name(self, obj):
        """Get full name of staff who collected cash"""
        return obj.collected_by.get_full_name() or obj.collected_by.email

    def get_handed_off_to_name(self, obj):
        """Get full name of admin who received handoff"""
        if obj.handed_off_to:
            return obj.handed_off_to.get_full_name() or obj.handed_off_to.email
        return None

    def get_status_display(self, obj):
        """Human-readable status"""
        return obj.get_status_display()


class CollectCashSerializer(serializers.Serializer):
    """Serializer for collecting cash payment"""

    payment_for = serializers.ChoiceField(
        choices=CashPayment.PAYMENT_FOR_CHOICES,
        help_text="Type of item being paid for"
    )
    registration_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Event registration ID (required if payment_for=registration)"
    )
    order_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Order ID (required if payment_for=product)"
    )
    dues_account_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Dues account ID (required if payment_for=dues)"
    )
    event_id = serializers.IntegerField(
        required=False,
        allow_null=True,
        help_text="Event ID for context (optional)"
    )
    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Staff notes about this payment"
    )

    def validate(self, data):
        """Validate that the correct ID is provided based on payment_for type"""
        payment_for = data["payment_for"]

        # Map payment_for to required field
        type_to_field = {
            "registration": "registration_id",
            "product": "order_id",
            "dues": "dues_account_id",
        }

        required_field = type_to_field.get(payment_for)
        if not data.get(required_field):
            raise serializers.ValidationError({
                required_field: f"This field is required when payment_for is '{payment_for}'"
            })

        # Validate the linked item exists and isn't already paid
        if payment_for == "registration":
            from apps.registrations.models import EventRegistration
            try:
                reg = EventRegistration.objects.get(pk=data["registration_id"])
                if reg.payment_status == "completed":
                    raise serializers.ValidationError({
                        "registration_id": "This registration is already paid"
                    })
                data["_registration"] = reg
                data["_amount"] = reg.event.price or 0
            except EventRegistration.DoesNotExist:
                raise serializers.ValidationError({
                    "registration_id": "Registration not found"
                })

        if payment_for == "product":
            try:
                order = Order.objects.get(pk=data["order_id"])
                if order.status in ["paid", "delivered"]:
                    raise serializers.ValidationError({
                        "order_id": "This order is already paid"
                    })
                data["_order"] = order
                data["_amount"] = order.total
            except Order.DoesNotExist:
                raise serializers.ValidationError({
                    "order_id": "Order not found"
                })

        if payment_for == "dues":
            from apps.portal.models import DuesAccount
            try:
                dues = DuesAccount.objects.get(pk=data["dues_account_id"])
                if dues.balance <= 0:
                    raise serializers.ValidationError({
                        "dues_account_id": "This account has no outstanding balance"
                    })
                data["_dues_account"] = dues
                data["_amount"] = dues.balance
            except DuesAccount.DoesNotExist:
                raise serializers.ValidationError({
                    "dues_account_id": "Dues account not found"
                })

        return data


class CashHandoffSerializer(serializers.Serializer):
    """Serializer for marking cash as handed off to admin"""

    notes = serializers.CharField(
        required=False,
        allow_blank=True,
        help_text="Notes about the handoff"
    )


class CashByStaffSerializer(serializers.Serializer):
    """Serializer for cash totals by staff member"""

    staff_id = serializers.IntegerField()
    staff_name = serializers.CharField()
    staff_email = serializers.EmailField()
    total_collected = serializers.DecimalField(max_digits=10, decimal_places=2)
    total_handed_off = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_amount = serializers.DecimalField(max_digits=10, decimal_places=2)
    pending_count = serializers.IntegerField()


class MerchDropSettingsSerializer(serializers.ModelSerializer):
    """Serializer for merch drop announcement settings"""

    is_countdown_active = serializers.BooleanField(read_only=True)
    has_dropped = serializers.BooleanField(read_only=True)

    class Meta:
        model = MerchDropSettings
        fields = [
            'is_active',
            'drop_date',
            'headline',
            'subheadline',
            'teaser_text',
            'is_countdown_active',
            'has_dropped',
            'updated_at',
        ]
        read_only_fields = ['updated_at']
