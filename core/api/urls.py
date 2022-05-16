from django.urls import path

from rest_framework_simplejwt.views import TokenRefreshView, TokenVerifyView
from .views import HasuraTokenObtainPairView, CreateUserView, UserDetails

urlpatterns = [
    path('user/', CreateUserView.as_view(), name='create_user'),
    path('user/me/', UserDetails.as_view(), name='get_user'),
    path('token/', HasuraTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]