from django.urls import path , include
from .views import *





urlpatterns = [
    path('products/page', products, name='dashboard-product'),
    path('product-images/<int:pk>/', ProductImageDeleteAPIView.as_view()),
    path('products/', DashboardProductAPIView.as_view(), name='dashboard-products'),
    path("orders/", admin_orders_page, name="admin-orders-page"),
    path('products/<int:pk>/', DashboardProductAPIView.as_view(), name='dashboard-product-detail'),
]
