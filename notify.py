#!/usr/bin/env python
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'blacknotes.settings')
import django
django.setup()

from users.models import PushNotifications
from notes.models import Note
from datetime import date


notes = Note.objects.filter(when=date.today()).order_by('user__id')

print(notes)
