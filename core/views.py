from django.http import HttpResponse, JsonResponse
from django.conf import settings
from django.views.generic.base import TemplateView
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
        user_data = {'id': request.user.id,
                     'username': request.user.username,
                     'admin': request.user.is_superuser}
        return JsonResponse(user_data)
    return HttpResponse('User not logged in', status=401)


class IndexTemplateView(TemplateView):

    def get_template_names(self):
        if settings.DEBUG:
            template_name = "index-dev.html"
        else:
            template_name = "index.html"
        return template_name
