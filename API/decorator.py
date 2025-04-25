from django.shortcuts import redirect
from django.http import HttpResponse
from django.contrib import messages
from functools import wraps
from rest_framework.response import Response
 

def superuser_access_only(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_superuser:
            return Response("Bu sayfaya erişim izniniz yok!", status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def admin_access_only(view_func):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_admin or not  request.user.is_superuser :
            return Response("Bu sayfaya erişim izniniz yok!", status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view


def seller_access_only(view_func ):
    @wraps(view_func)
    def _wrapped_view(request, *args, **kwargs):
        if not request.user.is_seller or not request.user.is_admin or not  request.user.is_superuser:
            return Response("Bu sayfaya erişim izniniz yok!", status=403)
        return view_func(request, *args, **kwargs)
    return _wrapped_view
 
 

