from rest_framework import serializers
from API.models import *
from API.serializers import *
from .models import *


class OrderItemSerializer(serializers.ModelSerializer):
    product_title = serializers.CharField(source='product.title', read_only=True)

    class Meta:
        model = OrderItem
        fields = ['product_title', 'quantity', 'price_at_order']


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True, read_only=True)  # OrderItem modelindeki related_name='items'
    user = serializers.StringRelatedField()  # opsiyonel: user ismini göster
    class Meta:
        model = Order
        fields = ['id', 'user', 'address', 'total_amount', 'status', 'created_at', 'items']
        read_only_fields = ['user', 'created_at']
