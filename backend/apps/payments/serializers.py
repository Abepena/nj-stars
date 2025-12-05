from rest_framework import serializers
from .models import Product, SubscriptionPlan


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
