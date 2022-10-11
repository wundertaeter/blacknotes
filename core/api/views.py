from rest_framework import permissions, generics, views, status
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from rest_framework_simplejwt import authentication
from rest_framework.response import Response
from core.api.serializers import HasuraTokenObtainPairSerializer, UserSerializer, UserListSerializer
from django.conf import settings
from rest_framework_simplejwt.exceptions import InvalidToken, TokenError
from datetime import date, timedelta, datetime
from django.contrib.auth.models import User
import jwt

def get_cookie_domain(request):
    return 'localhost' if settings.DEBUG else '.' + '.'.join(request.get_host().split('.')[1:])

def get_exp_date(token):
    return datetime.fromtimestamp(jwt.decode(token, options={"verify_signature": False})['exp'])

class HasuraTokenObtainPairView(TokenObtainPairView):
    serializer_class = HasuraTokenObtainPairSerializer

    def post(self, request, *args, **kwargs):
        resp = super().post(request, *args, **kwargs)
        tokens = resp.data
        domain = get_cookie_domain(request)
        resp.set_cookie('access', tokens['access'], domain=domain, samesite=None, httponly=True, secure=True, expires=get_exp_date(tokens['access']))
        resp.set_cookie('refresh', tokens['refresh'], domain=domain, samesite=None, httponly=True, secure=True, expires=get_exp_date(tokens['refresh']))
        return resp


class HasuraTokenRefreshView(TokenRefreshView):

    def post(self, request, *args, **kwargs):
        refresh = request.COOKIES.get('refresh')
        access = request.COOKIES.get('access')

        if refresh:
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
        domain = get_cookie_domain(request)
        resp.set_cookie('access', domain=domain, samesite=None, httponly=True, secure=True, expires=yesterday)
        resp.set_cookie('refresh', domain=domain, samesite=None, httponly=True, secure=True, expires=yesterday)
        return resp

class CreateUserView(generics.CreateAPIView):
    serializer_class = UserSerializer
    permission_classes = [
        permissions.AllowAny  # Or anon users can't register
    ]


class UsernameExistsView(views.APIView):
    serializer_class = UserListSerializer
    queryset = User.objects.all()
    permission_classes = [
        permissions.AllowAny  # Or anon users can't register
    ]

    def post(self, request):
        try:
            data = json.loads(request.body)
        except Exception as e:
            return Response({'success': False, 'error': 'invalid json'}, 500)
        username = data.get('username')
        print(username)
        data = {}
        if(username):
            data['exists'] = self.queryset.filter(username=username).exists()
        return Response(data)
        


class UserDetails(views.APIView):
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = [authentication.JWTAuthentication]

    def get(self, request, format=None):
        return Response({"id": request.user.id, "username": request.user.username, "email": request.user.email})


from users.models import PushNotifications
from notes.models import Note
from datetime import date
from pywebpush import webpush
from django.conf import settings
import json


class NotifyView(views.APIView):
    def post(self, request, *args, **kwargs):
        try:
            data = json.loads(request.body)
        except Exception as e:
            return Response({'success': False, 'error': 'invalid json'}, 500)

        if data.get('secret') != settings.SECRET_KEY:
            return Response({'success': False, 'error': 'unauthorized'}, 401)

        notes = Note.objects.filter(when=date.today()).order_by('user__id')
        print(notes)
        user = None

        for note in notes:
            if note.user != user:
                user = note.user
                subscriptions = PushNotifications.objects.filter(user=user)
            for sub in subscriptions:
                print('send message')
                webpush(subscription_info=sub.subscription,
                        data=json.dumps({'title': note.title}),
                        vapid_private_key=settings.WEBPUSH_SETTINGS['VAPID_PRIVATE_KEY'],
                        vapid_claims={"sub": 'mailto:' + settings.WEBPUSH_SETTINGS['VAPID_ADMIN_EMAIL']})
        return Response({'success': True}, 200)
