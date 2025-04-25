from django.contrib.auth import authenticate, login, logout
from django.contrib.auth.decorators import login_required
from django.utils.decorators import method_decorator
from django.views.decorators.csrf import csrf_exempt
from django.core.mail import send_mail
from django.shortcuts import render, redirect, get_object_or_404
from django.http import JsonResponse
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import generics, status , viewsets , permissions
from rest_framework.parsers import MultiPartParser ,FormParser
from .models import *
from .serializers import *
from django.conf import settings
from django.utils import timezone
import datetime, jwt, random, string, requests
from allauth.socialaccount.providers.google.views import GoogleOAuth2Adapter
from .forms import *
from rest_framework.decorators import action
from django.contrib.auth import get_user_model
from rest_framework.exceptions import AuthenticationFailed , NotFound
from django.core.exceptions import PermissionDenied
from django.db.models import Q
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt.settings import api_settings
from rest_framework.response import Response
from rest_framework import status
from rest_framework.permissions import AllowAny


from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication
from .authentication import CookieJWTAuthentication
from rest_framework_simplejwt.tokens import RefreshToken
from django.shortcuts import get_object_or_404
from .models import Product, ProductImage
from .serializers import ProductSerializer

import os
User = get_user_model()

@method_decorator(csrf_exempt, name='dispatch')
class RegisterAPI(generics.GenericAPIView):
    serializer_class = RegisterSerializer
    permission_classes = [AllowAny]
    def post(self, request, *args, **kwargs):
        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response({"message": "Kayıt başarılı"}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

IS_PROD = os.environ.get('DJANGO_PRODUCTION', False)

from django.http import JsonResponse

@method_decorator(csrf_exempt, name='dispatch')
class LoginAPI(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        password = request.data.get('password')
        print(email)
        print(password)
        user = authenticate(username=email, password=password)
        print(user)

        if not user:
            return JsonResponse({'detail': 'E-posta veya şifre hatalı!'}, status=401)

        login(request, user)
        refresh = RefreshToken.for_user(user)
        access_token = str(refresh.access_token)
        refresh_token = str(refresh)
        response = redirect('/')

        response.set_cookie(
            key='access_token',
            value=access_token,
            httponly=True,
            secure=IS_PROD,
            samesite='None' if IS_PROD else 'Lax',
            max_age=int(refresh.access_token.lifetime.total_seconds())
        )
        response.set_cookie(
            key='refresh_token',
            value=refresh_token,
            httponly=True,
            secure=IS_PROD,
            samesite='None' if IS_PROD else 'Lax',
            max_age=int(refresh.lifetime.total_seconds())
        )

        return response

    
    
    
def logout_api(request):
    if request.method == "POST":
        # Kullanıcıyı oturumdan çıkart
        logout(request)
        # JsonResponse ile yanıt verip cookie silme işlemlerini yapıyoruz
        response = JsonResponse({"detail": "Çıkış başarılı"})
        response.delete_cookie("access_token", path="/")
        response.delete_cookie("refresh_token", path="/")
        response.delete_cookie("csrftoken", path="/")
        return response
    return JsonResponse({"detail": "Yöntem desteklenmiyor"}, status=405)




# ------ ÜRÜN ------
# API/views.py


class ProductListCreateAPIView(APIView):
    parser_classes = [MultiPartParser, FormParser]
    authentication_classes = [JWTAuthentication, CookieJWTAuthentication]
    # GET de POST da artık herkese açık:
    
    # Önce header'dan Bearer, sonra cookie'den access_token okuyacak

    def get_permissions(self):
        # GET herkesin görebileceği endpoint
        if self.request.method == 'GET':
            return [AllowAny()]
        # POST sadece login'li kullanıcı
        return [IsAuthenticated()]

    def get(self, request):
        # Gerçek kullanıcı yoksa None
        user = request.user if request.user.is_authenticated else None

        products = Product.objects.all()
        serializer = ProductSerializer(
            products,
            many=True,
            context={'user': user}
        )
        return Response(serializer.data)

class ProductDetailAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request, id):
        product = get_object_or_404(Product, id=id)
        serializer = ProductSerializer(product)
        data = serializer.data

        # Kullanıcı bilgisi
        if request.user and request.user.is_authenticated:
            data['user_is_authenticated'] = True
            data['user'] = request.user.email
            data['current_user_id'] = request.user.id
        else:
            data['user_is_authenticated'] = False
            data['user'] = None
            data['current_user_id'] = None

        return Response(data)


    def delete(self, request, id):
        product = get_object_or_404(Product, id=id)
        product.delete()
        return Response({'message': 'Ürün başarıyla silindi.'}, status=status.HTTP_200_OK)

    def put(self, request, id):
        product = get_object_or_404(Product, id=id)
        serializer = ProductSerializer(product, data=request.data, partial=True)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response(serializer.data, status=status.HTTP_200_)



class ProductPermissionUpdateAPIView(APIView):
    def post(self, request):
        try:
            product = Product.objects.get(id=request.data.get("id"))
            product.permission = not product.permission
            product.save()
            return Response({'message': 'Durum güncellendi'})
        except Product.DoesNotExist:
            return Response({'message': 'Ürün bulunamadı'}, status=404)

from rest_framework.generics import RetrieveAPIView

class ProductRetrieveAPIView(RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer
    lookup_field = 'id'
    permission_classes = [AllowAny]

    def retrieve(self, request, *args, **kwargs):
        instance = self.get_object()
        serializer = self.get_serializer(instance)

        # 🔥 Log ürün objesi
        print("🎯 Giden ürün:", serializer.data)

        return Response(serializer.data) 

class ToggleLikeAPIView(APIView):
    def post(self, request, pk):
        user = request.user
        product = get_object_or_404(Product, pk=pk)

        if user in product.liked_by.all():
            product.liked_by.remove(user)
            message = "Beğeni kaldırıldı."
        else:
            product.liked_by.add(user)
            message = "Beğenildi."

        return Response({
            "message": message,
            "like_count": product.liked_by.count()
        }, status=status.HTTP_200_OK)


from rest_framework.authentication import SessionAuthentication               # ← ekledik


class LikedProductListAPIView(APIView):
    authentication_classes = [JWTAuthentication, CookieJWTAuthentication, SessionAuthentication]
    permission_classes = []

    def get(self, request, *args, **kwargs):
        user = request.user
        try:
            if not user or not user.is_authenticated:
                raise ValueError("Anonymous user")
            liked_products = Product.objects.filter(liked_by=user).prefetch_related('images')
        except Exception:
            liked_products = Product.objects.none()
        serializer = ProductSerializer(
            liked_products,
            many=True,
            context={'request': request, 'user': user}
        )
        return Response(serializer.data)


from rest_framework.exceptions import ValidationError
from rest_framework.permissions import IsAuthenticatedOrReadOnly
from rest_framework.authentication import SessionAuthentication


@method_decorator(csrf_exempt, name='dispatch')
class ReviewListCreateAPIView(generics.ListCreateAPIView):
    serializer_class = ReviewSerializer

    # GET herkese açık, POST için login şartı
    permission_classes = [IsAuthenticatedOrReadOnly]
    # JWT cookie’sini ve opsiyonel session auth’ı kullan
    authentication_classes = [JWTAuthentication, SessionAuthentication]

    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return Review.objects.filter(product_id=product_id)

    def perform_create(self, serializer):
        user = self.request.user
        # AnonymousUser yerine gerçekten girişli bir CustomUser bekliyoruz
        if user.is_anonymous:
            raise PermissionDenied("Yorum eklemek için giriş yapmanız gerekiyor.")

        product_id = self.kwargs.get('product_id')
        serializer.save(user=user, product_id=product_id)




class ReviewDeleteAPIView(APIView):
    def delete(self, request, pk):
        user = request.user
        
        if user is None:
            raise PermissionDenied("Giriş yapmalısınız.")

        try:
            review = Review.objects.get(pk=pk)
        except Review.DoesNotExist:
            raise NotFound("Yorum bulunamadı.")

        if review.user != user:
            raise PermissionDenied("Bu yorumu silme yetkiniz yok.")

        review.delete()
        return Response({"detail": "Yorum silindi."}, status=status.HTTP_204_NO_CONTENT)



class ProductListAPIView(generics.ListAPIView):
    serializer_class = ProductSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        queryset = Product.objects.all()
        search_query = self.request.query_params.get('search')
        if search_query:
            queryset = queryset.filter(
                Q(title__icontains=search_query) |
                Q(description__icontains=search_query) |
                Q(type__icontains=search_query)
            )
            print("\n\n\n\n\n\n",queryset,"\n\n\n\n\n")
        return queryset


class ProductSuggestionAPIView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        query = request.GET.get('q')
        if not query:
            return Response([])

        products = Product.objects.filter(
            Q(title__icontains=query)
        ).values_list('title', flat=True).distinct()[:8]  # ilk 8 öneri
        return Response(products)



# ------ GOOGLE GİRİŞ ------
@method_decorator(csrf_exempt, name='dispatch')
class GoogleLoginAPIView(APIView):
    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"error": "Token eksik"}, status=400)

        response = requests.get(f"https://oauth2.googleapis.com/tokeninfo?id_token={token}")
        if response.status_code != 200:
            return Response({"error": "Google token doğrulanamadı"}, status=400)

        payload = response.json()
        email = payload.get("email")
        name = payload.get("name")

        if not email:
            return Response({"error": "Google'dan e-posta alınamadı"}, status=400)

        user, created = CustomUser.objects.get_or_create(email=email, defaults={'username': name})
        if created:
            user.set_unusable_password()
            user.save()

        login(request, user)
        access_token = jwt.encode({
            "email": user.email,
            "exp": datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        }, settings.SECRET_KEY, algorithm="HS256")

        return Response({"access_token": access_token})


# ------ E-POSTA ------
def generate_token():
    return ''.join(random.choices(string.digits, k=6))


def send_email_example(to_email, token):
    try:
        send_mail(
            subject='Şifre Sıfırlama Kodu',
            message = f"http://localhost:8000/reset-password/{token}",
            from_email=settings.EMAIL_HOST_USER,
            recipient_list=[to_email],
        )
    except Exception as e:
        print("E-posta gönderilemedi:", e)


class SendEmailAPIView(APIView):
    def post(self, request):
        try:
            token = request.data.get("token")
            if token:
                update = UpdateCode.objects.get(token=token)
                user = update.user
            else:
                user = CustomUser.objects.get(email=request.data.get("email"))
        except Exception as e:
            return Response({"error": str(e)}, status=400)

        new_token = generate_token()
        UpdateCode.objects.update_or_create(
            user=user,
            defaults={
                'token': new_token,
                'expire_date': timezone.now() + datetime.timedelta(hours=1),
                'used': False,
            }
        )
        send_email_example(user.email, new_token)
        return Response({"message": "E-posta gönderildi."})


class UpdatePasswordAPIView(APIView):
    def post(self, request):
        token = request.data.get("token")
        new_password = request.data.get("password")
        try:
            update = UpdateCode.objects.get(token=token)
            user = update.user
            if update.expire_date < timezone.now() or update.used:
                return Response({"error": "Token geçersiz veya süresi dolmuş."}, status=400)
            if user.check_password(new_password):
                return Response({"error": "Yeni şifre eskisiyle aynı olamaz."}, status=400)

            user.set_password(new_password)
            user.save()
            update.used = True
            update.save()
            return Response({"message": "Şifre güncellendi."})
        except Exception as e:
            return Response({"error": str(e)}, status=400)



class CardViewSet(viewsets.ModelViewSet):
    """
    JWT içinde yer alan user bilgisiyle
    sadece o kullanıcıya ait kartlar üzerinde CRUD.
    """
    serializer_class = CardSerializer
    queryset = Cards.objects.none()  # filtreyi get_queryset içinde yapacağız

    # JWT, cookie-based ve session authentication
    authentication_classes = [
        JWTAuthentication,
        CookieJWTAuthentication,
        SessionAuthentication,
    ]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Sadece oturum açmış kullanıcının kartları
        return Cards.objects.filter(user=self.request.user).order_by('-id')

    def perform_create(self, serializer):
        # create ve update işlemlerinde user'ı otomatik atar
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # Silme izni: yalnızca sahibi silebilir
        instance = self.get_object()
        if instance.user != request.user:
            return Response({'detail': 'Yetkiniz yok.'},
                             status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)

    @action(detail=False, methods=['get'], url_path='recent')
    def recent(self, request):
        # En son 5 kartı döner
        recent_cards = self.get_queryset()[:5]
        serializer = self.get_serializer(recent_cards, many=True)
        return Response(serializer.data)


class AddressViewSet(viewsets.ModelViewSet):
    """
    Giriş yapmış kullanıcının adresleri üzerinde CRUD.
    """
    serializer_class = AddressSerializer
    authentication_classes = [
        JWTAuthentication,
        CookieJWTAuthentication,
        SessionAuthentication,
    ]
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Sadece kendi adresleriniz
        return Address.objects.filter(user=self.request.user).order_by('-created_at')

    def perform_create(self, serializer):
        # Yeni adres oluştururken user ataması
        serializer.save(user=self.request.user)

    def destroy(self, request, *args, **kwargs):
        # Silme izni: yalnızca sahibi silebilir (ek güvenlik)
        instance = self.get_object()
        if instance.user != request.user:
            return Response({'detail': 'Yetkiniz yok.'},
                            status=status.HTTP_403_FORBIDDEN)
        return super().destroy(request, *args, **kwargs)
    
    
class ReviewViewSet(viewsets.ModelViewSet):
    queryset = Review.objects.all()
    serializer_class = ReviewSerializer
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def perform_create(self, serializer):
        user = self.request.user
        if not user:
            raise AuthenticationFailed("Kullanıcı doğrulanamadı.")
        serializer.save(user=user)





@method_decorator(csrf_exempt, name='dispatch')
class RefreshTokenAPI(APIView):
    """
    Cookie'deki refresh_token'ı alarak yeni bir access token üretir.
    """
    def post(self, request):
        refresh = request.COOKIES.get('refresh_token')
        if not refresh:
            raise AuthenticationFailed("Refresh token bulunamadı.")

        # Decode ve doğrula
        try:
            payload = jwt.decode(refresh, settings.SECRET_KEY, algorithms=['HS256'])
        except jwt.ExpiredSignatureError:
            raise AuthenticationFailed("Refresh token süresi dolmuş.")
        except jwt.InvalidTokenError:
            raise AuthenticationFailed("Geçersiz refresh token.")

        email = payload.get('email')
        if not email:
            raise AuthenticationFailed("Refresh token içinde email yok.")

        # Kullanıcının hâlâ var olduğunu kontrol et
        try:
            user = User.objects.get(email=email)
        except User.DoesNotExist:
            raise AuthenticationFailed("Kullanıcı bulunamadı.")

        # Yeni access token üret
        new_access_payload = {
            'email': user.email,
            'exp': datetime.datetime.utcnow() + datetime.timedelta(minutes=30)
        }
        new_access = jwt.encode(new_access_payload, settings.SECRET_KEY, algorithm='HS256')

        # Yanıt olarak sadece access cookie set et
        response = Response({"message": "Access token yenilendi"}, status=status.HTTP_200_OK)
        response.set_cookie(
            key='access_token',
            value=new_access,
            httponly=True,
            samesite='Lax',
            max_age=30 * 60
        )
        return response






# ------ STATİK SAYFALAR ------
def loggin(request):
    return render(request, "socialaccount/login.html")

def Register(request):
    return render(request, "register.html")

def HomePage(request):
    return render(request, "home.html")



def forgetPassword(request, token):
    return render(request, "forgetPassword.html", {"token": token})

def sendEmailPage(request):
    return render(request, "sendEmail.html")

def logout_view(request):
    logout(request)
    return render(request, 'logout.html')

def No_page(request, exception):
    return render(request, "404.html", {})
from django.shortcuts import render

def bag_view(request):
    return render(request, "bag.html")



def ProductList(request ):
    return render(request, "products_list.html")



def admin_product(request):
    return render(request, "admin_product.html")



def profile_view(request):
    return render(request, "profile.html")


def liked_view(request):
    return render(request, "liked.html")



def product_detail(request, id):
    return render(request, 'product_detail.html', {
        'product': {'id': id}  
    })


from django.shortcuts import render

def search_results_page(request):
    return render(request, 'search_results.html')

from allauth.socialaccount.providers.oauth2.views import OAuth2CallbackView


class GoogleCustomCallbackView(OAuth2CallbackView):
    adapter_class = GoogleOAuth2Adapter