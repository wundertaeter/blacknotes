from operator import mod
from django.db import models
from django.contrib.auth.models import User

class Profile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    avatar = models.CharField(max_length=64, null=True, blank=True)
    friends = models.ManyToManyField(User, related_name='friends')
    white_mode = models.BooleanField(default=False)



class PushNotifications(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    subscription = models.JSONField()

