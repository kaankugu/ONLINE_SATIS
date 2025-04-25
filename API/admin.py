from django.contrib import admin
from .models import CustomUser, Product, ProductImage

class ProductImageInline(admin.TabularInline):
    model = ProductImage
    max_num = 15
    extra = 1  # yeni resim eklemek için boş satır

class ProductAdmin(admin.ModelAdmin):
    inlines = [ProductImageInline]

    # Admin panelde liste görünümü
    list_display = ('title', 'type', 'price', 'permission', 'created_at')
    
    # Liste filtreleri sağda
    list_filter = ('type', 'permission', 'created_at')
    
    # Arama çubuğu
    search_fields = ('title', 'description')

admin.site.register(CustomUser)
admin.site.register(Product, ProductAdmin)
