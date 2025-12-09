from rest_framework import serializers
from .models import Product, ProductImage, SubscriptionPlan, Cart, CartItem, Order, OrderItem


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


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""

    in_stock = serializers.ReadOnlyField()
    primary_image_url = serializers.ReadOnlyField()
    images = ProductImageSerializer(many=True, read_only=True)

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
            'image_url',
            'primary_image_url',
            'images',
            'is_active',
            'featured',
            'best_selling',
            'on_sale',
            'stock_quantity',
            'in_stock',
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


class CartItemSerializer(serializers.ModelSerializer):
    """Serializer for cart items with nested product data"""

    product = ProductSerializer(read_only=True)
    product_id = serializers.IntegerField(write_only=True)
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )
    is_available = serializers.BooleanField(read_only=True)

    class Meta:
        model = CartItem
        fields = [
            'id',
            'product',
            'product_id',
            'quantity',
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


class CartSerializer(serializers.ModelSerializer):
    """Serializer for shopping cart with nested items"""

    items = CartItemSerializer(many=True, read_only=True)
    item_count = serializers.IntegerField(read_only=True)
    subtotal = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = Cart
        fields = [
            'id',
            'items',
            'item_count',
            'subtotal',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']


class AddToCartSerializer(serializers.Serializer):
    """Serializer for adding items to cart"""

    product_id = serializers.IntegerField()
    quantity = serializers.IntegerField(default=1, min_value=1)

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


class UpdateCartItemSerializer(serializers.Serializer):
    """Serializer for updating cart item quantity"""

    quantity = serializers.IntegerField(min_value=0)

    def validate_quantity(self, value):
        """Quantity of 0 means remove item"""
        return value


class OrderItemSerializer(serializers.ModelSerializer):
    """Serializer for order items"""

    product_image = serializers.SerializerMethodField()
    total_price = serializers.DecimalField(
        max_digits=10, decimal_places=2, read_only=True
    )

    class Meta:
        model = OrderItem
        fields = [
            'id',
            'product_name',
            'product_price',
            'quantity',
            'total_price',
            'product_image',
        ]
        read_only_fields = ['id']

    def get_product_image(self, obj):
        """Get product image URL if product still exists"""
        if obj.product:
            return obj.product.image_url
        return None


class OrderSerializer(serializers.ModelSerializer):
    """Serializer for Order model"""

    items = OrderItemSerializer(many=True, read_only=True)
    status_display = serializers.SerializerMethodField()

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
            'shipping_name',
            'shipping_email',
            'shipping_address_line1',
            'shipping_address_line2',
            'shipping_city',
            'shipping_state',
            'shipping_zip',
            'shipping_country',
            'items',
            'created_at',
            'updated_at',
        ]
        read_only_fields = ['id', 'created_at', 'updated_at']

    def get_status_display(self, obj):
        """Return human-readable status"""
        return obj.get_status_display()
