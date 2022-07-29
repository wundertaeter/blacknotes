from django.urls import path

from rest_framework_simplejwt.views import TokenVerifyView
from .views import HasuraTokenObtainPairView, CreateUserView, UsernameExistsView, UserDetails, HasuraTokenRefreshView, LogoutView, NotifyView

urlpatterns = [
    path('user/', CreateUserView.as_view(), name='create_user'),
    path('username/', UsernameExistsView.as_view(), name='username'),
    path('user/me/', UserDetails.as_view(), name='get_user'),
    path('user/logout/', LogoutView.as_view(), name='logout'),
    path('token/', HasuraTokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', HasuraTokenRefreshView.as_view(), name='token_refresh'),
    path('token/verify/', TokenVerifyView.as_view(), name='token_verify'),
    path('notify/', NotifyView.as_view(), name='notify-view'),
]