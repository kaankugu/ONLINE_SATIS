
from rest_framework_simplejwt.authentication import JWTAuthentication
from rest_framework_simplejwt.exceptions import InvalidToken, AuthenticationFailed as JWTAuthFailed

class CookieJWTAuthentication(JWTAuthentication):
    """
    Hem Authorization header'dan hem de 'access_token' HttpOnly cookie'den token okur.
    """
    def authenticate(self, request):
        # 1) Önce header'a bak
        header = self.get_header(request)
        raw_token = None

        if header is not None:
            raw_token = self.get_raw_token(header)
        # 2) Header yoksa cookie'den oku
        elif 'access_token' in request.COOKIES:
            raw_token = request.COOKIES.get('access_token')

        if raw_token is None:
            return None

        # 3) Token'ı doğrula ve user'ı döndür
        validated_token = self.get_validated_token(raw_token)
        return self.get_user(validated_token), validated_token
