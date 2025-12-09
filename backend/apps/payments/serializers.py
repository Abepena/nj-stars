from rest_framework import serializers
from .models import Product, SubscriptionPlan, Cart, CartItem


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model"""

    in_stock = serializers.ReadOnlyField()

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
