from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.views.generic import TemplateView
from API.views import GoogleCustomCallbackView  

urlpatterns = [
    path('dashboard/', include('dashboard.urls')),

    path('admin/', admin.site.urls),

    path('orders/', include('orders.urls')),


    path('accounts/', include('allauth.urls')),

    path('', include('API.urls')),


    path('', TemplateView.as_view(template_name='index.html'), name='home'),
]

# Media & Static dosya servisleri (geliştirme ortamı için)
if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
    urlpatterns += static(settings.STATIC_URL, document_root=settings.STATICFILES_DIRS[0])
