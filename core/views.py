from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.views.generic.base import TemplateView
from django.contrib.auth import login, authenticate, logout
import json

def inspect_user(request):
    print('+++++ Authhook from hasura: ', request.user)
    if request.user.is_authenticated:
        user_data = {'x-hasura-user-id': str(request.user.id)}
        if request.user.is_superuser:
            user_data['x-hasura-role'] = 'admin'
        else:
            user_data['x-hasura-role'] = 'user'
        return JsonResponse(user_data)
    else:
        return HttpResponse('User not logged in', status=401)


def get_user(request):
    if request.user.is_authenticated:
        user = request.user
        login(request, user)
        user_data = {'id': request.user.id,
                 'username': request.user.username,
                 'admin': request.user.is_superuser,
                 'active': request.user.is_active}
        return JsonResponse({'user': user_data})
    return JsonResponse({'user': None}, status=401)

def login_view(request):
    data = json.loads(request.body)
    username = data.get('username')
    password = data.get('password')
    user = authenticate(username=username, password=password)
    print(username, password, data, user)
    if not user:
        return JsonResponse({'user': None}, status=401)
    login(request, user)
    return JsonResponse({'user': {'id': request.user.id,
                 'username': request.user.username,
                 'admin': request.user.is_superuser,
                 'active': request.user.is_active}})


def logout_view(request):
    if request.user.is_authenticated:
        logout(request)
        return JsonResponse({'success': True})
    return JsonResponse({'success': False}, status=401)

class IndexTemplateView(TemplateView):

    def get_template_names(self):
        if settings.DEBUG:
            template_name = "index-dev.html"
        else:
            template_name = "index.html"
        return template_name
