from django.urls import path
from django.urls import path, re_path
from . import views

urlpatterns = [
    path('validate_request', views.inspect_user, name='inspect-user'),
    path('get_user', views.get_user, name='get-user'),
    re_path(r"^.*$", views.IndexTemplateView.as_view(), name="entry-point"),
]