#!/usr/bin/env python
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'blacknotes.settings')
import django
django.setup()

from users.models import PushNotifications
from notes.models import Note
from datetime import date
#from webpush.utils import send_to_subscription
from pywebpush import webpush
from django.conf import settings
import json
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
                data=json.dumps({'msg': 'Hey'}),
                vapid_private_key=settings.WEBPUSH_SETTINGS['VAPID_PRIVATE_KEY'],
                vapid_claims={"sub": 'mailto:' + settings.WEBPUSH_SETTINGS['VAPID_ADMIN_EMAIL']})
