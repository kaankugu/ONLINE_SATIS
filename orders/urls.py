from django.urls import path
from .views import *

urlpatterns = [
    # Kullanıcının kendi siparişlerini listele + oluştur
    path('orders/', UserOrderListCreateAPIView.as_view(), name='user-orders'),

    path('my-orders/', my_orders_view, name='my-orders'),

    path("my-orders/<int:pk>/", order_detail_page, name="order-detail-page"),

    # Admin tüm siparişleri görebilsin
    path('all/', AdminOrderListAPIView.as_view(), name='admin-orders'),

    # Sipariş detay (admin veya sahibi)
    path('orders/<int:pk>/', OrderDetailAPIView.as_view(), name='order-detail'),

    path('create/', OrderCreateAPIView.as_view(), name='order-create'),

    path('delete/<int:pk>/', OrderDeleteAPIView.as_view(), name='order-delete'),


    path('checkout/', Checkout_page, name='checkout'),

]
