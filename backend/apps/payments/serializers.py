from rest_framework import serializers
from .models import Product, ProductImage, ProductVariant, SubscriptionPlan, Bag, BagItem, Order, OrderItem


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
