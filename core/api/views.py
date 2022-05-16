from rest_framework import permissions, generics, views
from rest_framework_simplejwt.views import TokenObtainPairView
from rest_framework_simplejwt import authentication
from rest_framework.response import Response
from core.api.serializers import HasuraTokenObtainPairSerializer, UserSerializer

class HasuraTokenObtainPairView(TokenObtainPairView):
    serializer_class = HasuraTokenObtainPairSerializer

class CreateUserView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [
        permissions.AllowAny  # Or anon users can't register
    ]


class UserDetails(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [authentication.JWTAuthentication]

    def get(self, request, format=None):
        return Response({"id": request.user.id, "username": request.user.username, "email": request.user.email})