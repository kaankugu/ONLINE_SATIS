# utils.py
import jwt
from django.conf import settings
from rest_framework.exceptions import AuthenticationFailed
from django.contrib.auth import get_user_model

User = get_user_model()

def get_user_from_jwt(request):
    """
    Cookie'deki access_token'ı decode edip kullanıcıyı döndürür.
    """
    token = request.COOKIES.get('access_token')
    if not token:
        raise AuthenticationFailed("Token bulunamadı (Cookie'de access_token yok).")

    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=['HS256'])
    except jwt.ExpiredSignatureError:
        raise AuthenticationFailed("Token süresi dolmuş.")
    except jwt.InvalidTokenError:
        raise AuthenticationFailed("Geçersiz token.")

    email = payload.get('email')
    if not email:
        raise AuthenticationFailed("Token içinde e-posta bilgisi yok.")

    try:
        user = User.objects.get(email=email)
    except User.DoesNotExist:
        raise AuthenticationFailed("E-posta ile eşleşen kullanıcı bulunamadı.")

    return user