import uuid
from django.db import models
from django.utils import timezone
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.core.validators import RegexValidator
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator


class UserAccountManager(BaseUserManager):
    def create_user(self, email, username, password=None):
        if not email:
            raise ValueError("Email field is required!")
        if not username:
            raise ValueError("Username field is required!")
        if not password:
            raise ValueError("Password field is required!")

        user = self.model(email=email, username=username)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, username, password):
        user = self.create_user(email=email, username=username, password=password)
        user.is_superuser = True
        user.is_staff = True
        user.is_admin = True
        user.save()
        return user

    def create_admin(self, email, username, password):
        user = self.create_user(email, username, password)
        user.is_admin = True
        user.save()
        return user

    def create_seller(self, email, username, password):
        user = self.create_user(email, username, password)
        user.is_seller = True
        user.save()
        return user

    def create_customer(self, email, username, password):
        user = self.create_user(email, username, password)
        user.is_customer = True
        user.save()
        return user


class Address(models.Model):
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='addresses')
    title = models.CharField(max_length=100)  # Ev, İş, vb.
    city = models.CharField(max_length=100)
    district = models.CharField(max_length=100)
    full_address = models.TextField()

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.title} - {self.city}"

class Cards(models.Model):
    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='owned_cards'  
    )
    card_number = models.CharField(max_length=16)
    card_holder = models.CharField(max_length=100, default="Bilinmiyor")
    expiration_date = models.CharField(
        max_length=5,
        validators=[
            RegexValidator(
                regex=r'^(0[1-9]|1[0-2])\/\d{2}$',
                message="Son kullanma tarihi MM/YY formatında olmalıdır. Örneğin: 04/25"
            )
        ]
    )
    cvv = models.CharField(max_length=4)

    def __str__(self):
        return f"Kart: **** **** **** {self.card_number[-4:]}"

class CustomUser(AbstractUser):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    username = models.CharField(max_length=200)
    email = models.EmailField(max_length=200, unique=True)
    address = models.ManyToManyField(Address, blank=True)
    cards = models.ManyToManyField(Cards, blank=True)
    phone_number = models.CharField(max_length=15, null=True, blank=True)
    birth_date = models.DateField(null=True, blank=True)
    is_seller = models.BooleanField(default=False)
    is_customer = models.BooleanField(default=True)
    is_admin = models.BooleanField(default=False)

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ['username']

    objects = UserAccountManager()

    def __str__(self):
        return self.username

    def has_perm(self, perm, obj=None):
        return self.is_admin

    def has_module_perms(self, app_label):
        return True


class Product(models.Model):
    TYPE_CHOICES = [
        ('tabak', 'Tabak'),
        ('kase', 'Kase'),
        ('karo', 'Karo'),
        ('vazo', 'Vazo'),
        ('diğer', 'Diğer'),
    ]
     
    title = models.CharField(max_length=100)
    description = models.TextField()    
    price = models.DecimalField(max_digits=10, decimal_places=2)
    permission = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    liked_by = models.ManyToManyField(settings.AUTH_USER_MODEL, related_name='liked_products', blank=True)
    type = models.CharField(max_length=50, choices=TYPE_CHOICES, default='diğer')

    def __str__(self):
        return self.title
    
    def total_likes(self):
        return self.liked_by.count()

class ProductImage(models.Model):
    product = models.ForeignKey(Product, related_name='images', on_delete=models.CASCADE)
    image = models.ImageField(upload_to='prod_images/')
    uploaded_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"{self.product.title} Görseli"



class UpdateCode(models.Model):
    token = models.CharField(max_length=50)
    expire_date = models.DateTimeField(default=timezone.now() + timezone.timedelta(minutes=5))
    used = models.BooleanField(default=False)
    user = models.ForeignKey(CustomUser, on_delete=models.CASCADE)

    class Meta:
        ordering = ['-expire_date']

    def __str__(self):
        return f"Token: {self.token} | Kullanıldı: {self.used}"
    
    

class Review(models.Model):
    product = models.ForeignKey('Product', on_delete=models.CASCADE, related_name='reviews')
    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='reviews')
    rating = models.PositiveSmallIntegerField(
        validators=[MinValueValidator(1), MaxValueValidator(5)]
    )
    comment = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.product} | {self.rating} yıldız"