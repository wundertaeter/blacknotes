from django.urls import path
from django.urls import path, re_path
from django.views.decorators.csrf import csrf_exempt
from . import views

urlpatterns = [
    path('validate_request', views.inspect_user, name='inspect-user'),
    path('get_user', views.get_user, name='get-user'),
    path('login_view', csrf_exempt(views.login_view), name='login-user'),
    path('logout_view', views.logout_view, name='logout-user')
]