from rest_framework import serializers
from .models import *
from django.contrib.auth.password_validation import validate_password
from rest_framework.validators import UniqueValidator


class RegisterSerializer(serializers.ModelSerializer):
    email = serializers.EmailField(
        required=True,
        validators=[UniqueValidator(queryset=CustomUser.objects.all())]
    )
    password = serializers.CharField(
        write_only=True,
        required=True,
        validators=[validate_password]
    )
    password2 = serializers.CharField(write_only=True, required=True)

    class Meta:
        model = CustomUser
        fields = ('email', 'username', 'password', 'password2')

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError("Şifreler eşleşmiyor.")
        return data

    def create(self, validated_data):
        validated_data.pop('password2')
        user = CustomUser.objects.create_user(**validated_data)
        return user



class ReviewSerializer(serializers.ModelSerializer):
    user = serializers.StringRelatedField(read_only=True)

    class Meta:
        model = Review
        fields = ['id', 'user', 'product', 'rating', 'comment', 'created_at']
        read_only_fields = ['user', 'created_at', 'product']
    def get_user(self, obj):
        name = str(obj.user)
        return name[:3] + '*' * (len(name) - 3)

class ProductImageSerializer(serializers.ModelSerializer):
    class Meta:
        model = ProductImage
        fields = ['id', 'image']

 
class ProductSerializer(serializers.ModelSerializer):
    images = ProductImageSerializer(many=True, read_only=True)
    is_liked = serializers.SerializerMethodField()
    like_count = serializers.SerializerMethodField()
    reviews = ReviewSerializer(many=True, read_only=True)  # Ürünle ilişkili yorumlar ekleniyor

    class Meta:
        model = Product
        fields = ['id', 'title', 'description', 'price', 'permission', 'images', 'is_liked', 'like_count', 'reviews',"type"]

    def get_is_liked(self, obj):
        user = self.context.get('user')
        if user and user.is_authenticated:
            return obj.liked_by.filter(id=user.id).exists()
        return False

    def get_like_count(self, obj):
        return obj.liked_by.count()


class AddressSerializer(serializers.ModelSerializer):
    class Meta:
        model = Address
        fields = '__all__'
        read_only_fields = ('user',)


class CardSerializer(serializers.ModelSerializer):
    class Meta:
        model = Cards
        fields = '__all__'
        read_only_fields = ('user',)


class UserSerializer(serializers.ModelSerializer):
    address = AddressSerializer(many=True, read_only=True)
    cards = CardSerializer(many=True, read_only=True)

    class Meta:
        model = CustomUser
        fields = ['id', 'email', 'username', 'phone_number', 'birth_date', 'is_seller', 'is_customer', 'address', 'cards']
        
        
        
