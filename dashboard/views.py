# dashboard/views.py

from API.models import *
from functools import wraps
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication, JWTAuthentication 
from API.models import Product, ProductImage
from API.serializers import ProductSerializer
import datetime, jwt, random, string, requests
from django.shortcuts import render
from API.authentication import  CookieJWTAuthentication
from django.contrib.auth.decorators import login_required



def check_superuser(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        request.is_admin = request.user.is_authenticated and request.user.is_superuser
        return view_func(request, *args, **kwargs)
    return _wrapped_view



class DashboardProductAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [JWTAuthentication, CookieJWTAuthentication]

    def get_permissions(self):
        if self.request.method == 'GET':
            return [AllowAny()]
        return [IsAuthenticated()]

    def get(self, request):
        products = Product.objects.all()
        serializer = ProductSerializer(products, many=True, context={'user': request.user})
        return Response(serializer.data)

    def post(self, request):
        try:
            if not request.user.is_superuser:
                return Response({'error': 'Sadece yöneticiler işlem yapabilir.'}, status=status.HTTP_403_FORBIDDEN)

            serializer = ProductSerializer(data=request.data, context={'request': request})
            if serializer.is_valid():
                product = serializer.save()
                for img in request.FILES.getlist('images'):
                    ProductImage.objects.create(product=product, image=img)
                return Response(ProductSerializer(product).data, status=status.HTTP_201_CREATED)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def put(self, request, pk=None):
        try:
            if not request.user.is_superuser:
                return Response({'error': 'Sadece yöneticiler işlem yapabilir.'}, status=status.HTTP_403_FORBIDDEN)

            product = Product.objects.get(pk=pk)
            serializer = ProductSerializer(product, data=request.data, context={'request': request})
            if serializer.is_valid():
                product = serializer.save()
                for img in request.FILES.getlist('images'):
                    ProductImage.objects.create(product=product, image=img)
                return Response(ProductSerializer(product).data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'error': 'Ürün bulunamadı'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    def delete(self, request, pk=None):
        try:
            if not request.user.is_superuser:
                return Response({'error': 'Sadece yöneticiler işlem yapabilir.'}, status=status.HTTP_403_FORBIDDEN)

            product = Product.objects.get(pk=pk)
            product.delete()
            return Response({'detail': 'Silindi'}, status=status.HTTP_204_NO_CONTENT)
        except Product.DoesNotExist:
            return Response({'error': 'Ürün bulunamadı'}, status=status.HTTP_404_NOT_FOUND)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
        
        
    def patch(self, request, pk=None):
        try:
            product = Product.objects.get(pk=pk)
            serializer = ProductSerializer(product, data=request.data, partial=True, context={'request': request})
            if serializer.is_valid():
                serializer.save()
                return Response(serializer.data)
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
        except Product.DoesNotExist:
            return Response({'error': 'Ürün bulunamadı'}, status=status.HTTP_404_NOT_FOUND)


class ProductImageDeleteAPIView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            image = ProductImage.objects.get(pk=pk)
            image.delete()
            return Response(status=204)
        except ProductImage.DoesNotExist:
            return Response({'error': 'Resim bulunamadı'}, status=404)





from django.contrib.auth.decorators import login_required, user_passes_test


@user_passes_test(lambda u: u.is_superuser)
@login_required
def products(request):
    return render(request, "dashboard/dashboard_products.html")
    


@user_passes_test(lambda u: u.is_superuser)
@login_required
def admin_orders_page(request):
    return render(request, "dashboard/dashboard_orders.html")
