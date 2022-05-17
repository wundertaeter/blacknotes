from rest_framework import permissions, generics, views, status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt import authentication
from rest_framework.response import Response
from core.api.serializers import HasuraTokenObtainPairSerializer, UserSerializer
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from datetime import date, timedelta

class HasuraTokenObtainPairView(TokenObtainPairView):
    serializer_class = HasuraTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        tokens = resp.data
        if settings.DEBUG:
            resp.set_cookie('access', tokens['access'], domain='localhost', samesite=None, httponly=True)
            resp.set_cookie('refresh', tokens['refresh'], domain='localhost', samesite=None, httponly=True)
        else:
            for origin in settings.CORS_ALLOWED_ORIGINS:
                domain = origin.replace('http://', '').replace('https://', '')
                resp.set_cookie('access', tokens['access'], domain=domain, samesite=None, httponly=True)
                resp.set_cookie('refresh', tokens['refresh'], domain=domain, samesite=None, httponly=True)
        return resp


class HasuraTokenRefreshView(TokenRefreshView):

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get('refresh')
        access = request.COOKIES.get('access')

        if refresh and access:
            serializer = self.get_serializer(data={'refresh': refresh, 'access': access})
        else:
            serializer = self.get_serializer(data=request.data)

        try:
            serializer.is_valid(raise_exception=True)
        except TokenError as e:
            raise InvalidToken(e.args[0])

        return Response(serializer.validated_data, status=status.HTTP_200_OK)


class LogoutView(generics.GenericAPIView):

    def post(self, request, *args, **kwargs):
        resp = Response({}, status=status.HTTP_200_OK)
        yesterday = date.today() - timedelta(days=1)
        if settings.DEBUG:
            resp.set_cookie('access', domain='localhost', samesite=None, httponly=True, expires=yesterday)
            resp.set_cookie('refresh', domain='localhost', samesite=None, httponly=True, expires=yesterday)
        else:
            for origin in settings.CORS_ALLOWED_ORIGINS:
                domain = origin.replace('http://', '').replace('https://', '')
                resp.set_cookie('access', domain=domain, samesite=None, httponly=True, expires=yesterday)
                resp.set_cookie('refresh', domain=domain, samesite=None, httponly=True, expires=yesterday)
        return resp

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