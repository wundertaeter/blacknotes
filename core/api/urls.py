from django.urls import path

from rest_framework_simplejwt.views import TokenVerifyView
from .views import HasuraTokenObtainPairView, CreateUserView, UserDetails, HasuraTokenRefreshView, LogoutView

urlpatterns = [
    path('user/', CreateUserView.as_view(), name='create_user'),
    path('user/me/', UserDetails.as_view(), name='get_user'),
    path('user/logout/', LogoutView.as_view(), name='logout'),
    path('token/', HasuraTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', HasuraTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
]