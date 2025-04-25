from django.urls import path ,include 
from API.views import *
from rest_framework.routers import DefaultRouter




router = DefaultRouter()
router.register(r'cards', CardViewSet, basename='cards')
router.register(r'addresses', AddressViewSet, basename='addresses')
router.register(r'reviews', ReviewViewSet, basename='reviews')





urlpatterns = [
    # Sayfa görünümleri
    path('', HomePage, name="home-page"),
    path('login/', loggin, name="login-page"),
    path('register/', Register, name="register-page"),
    path('logout/', logout_view, name="logout"),
    path('send-email-page/', sendEmailPage, name="send-email-page"),
    path('reset-password/<str:token>/', forgetPassword, name="reset-password-page"),
    path('bag/', bag_view, name='bag'),
    path('products-admin/', admin_product, name="products-admin"),
    path('products/', ProductList, name="products"),
    path('profile/', profile_view, name="profile"),
    path('liked/', liked_view, name="liked"),
    path('product-detail/<int:id>/', product_detail, name='product-detail-html'),
    path("search-results/", search_results_page, name="search-results-page"),

    

    path('api/', include(router.urls)),

    # API endpointleri
    path('api/product/<int:id>/', ProductRetrieveAPIView.as_view(), name='product-detail'),
    path("api/products/suggestions/", ProductSuggestionAPIView.as_view(), name="product-suggestions"),
    path("api/search/products/", ProductListAPIView.as_view(), name="product-list"),
    path('api/reviews/<int:pk>/delete/', ReviewDeleteAPIView.as_view(), name='review-delete'),
    path('api/products/<int:product_id>/reviews/', ReviewListCreateAPIView.as_view(), name='reviews'),
    path('api/logout/', logout_api, name='logout-api'),
    path('api/product-detail/<int:id>/', ProductDetailAPIView.as_view(), name='product-detail'),
    path('api/products/liked/', LikedProductListAPIView.as_view(), name='liked-products'),
    path('api/products/<int:pk>/toggle-like/', ToggleLikeAPIView.as_view(), name='product-toggle-like'),
    path('api/register/', RegisterAPI.as_view(), name='api-register'),
    path('api/login/', LoginAPI.as_view(), name='api-login'),
    path('api/products/', ProductListCreateAPIView.as_view(), name="api-products"),
    path('api/product/permission/', ProductPermissionUpdateAPIView.as_view(), name="api-product-permission"),
    path('api/send-email/', SendEmailAPIView.as_view(), name="api-send-email"),
    path('api/update-password/', UpdatePasswordAPIView.as_view(), name="api-update-password"),
    path('api/product/create/', ProductListCreateAPIView.as_view(), name='product-create'),
    path('api/token/refresh/', RefreshTokenAPI.as_view(), name='token_refresh'),

    # Hata sayfası
    path('404/', No_page, name="404")
]
 