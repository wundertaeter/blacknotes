from django.db import models
from django.dispatch import receiver
from django.db.models import signals
from django.contrib.auth.models import User
from users.models import Profile
from django.core.exceptions import ObjectDoesNotExist


@receiver(signals.post_save, sender=User)
def auth_signal(sender, instance, **kwargs):
    try:
        instance.profile
    except ObjectDoesNotExist:
        profile = Profile.objects.create(user=instance)
        print('profile created', profile)
