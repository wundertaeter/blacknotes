from ssl import create_default_context
from statistics import mode
from turtle import position
from django.db import models
from django.contrib.auth.models import User
from django.db.models.signals import post_save


class Space(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='spaces')
    name = models.CharField(max_length=128, null=True, blank=True)
    icon = models.CharField(max_length=64, default="view_in_ar")
    position = models.IntegerField()
    deleted = models.BooleanField(default=False)

class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    name = models.CharField(max_length=128, null=True, blank=True)
    icon = models.CharField(max_length=64, default="radio_button_unchecked")
    space = models.ForeignKey(Space, null=True, blank=True, on_delete=models.CASCADE, related_name='projects')
    position = models.IntegerField()
    default = models.BooleanField(default=False)
    done = models.BooleanField(default=False)
    completed_at = models.DateField(null=True, blank=True)
    deleted = models.BooleanField(default=False)

class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    title = models.CharField(max_length=256)
    position = models.IntegerField()
    project = models.ForeignKey(Project, on_delete=models.CASCADE, related_name='notes')
    deleted = models.BooleanField(default=False)
    done = models.BooleanField(default=False)
    completed_at = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)


def user_post_save_receiver(sender, instance, created, **kwargs):
    if created:
        Project.objects.create(name='Today', default=True, position=0, icon="star", user=instance)
        Project.objects.create(name='Upcoming', default=True, position=0, icon="date_range", user=instance)
        Project.objects.create(name='Anytime', default=True, position=0, icon="reorder", user=instance)
        Project.objects.create(name='Someday', default=True, position=0, icon="unarchive", user=instance)


post_save.connect(user_post_save_receiver, sender=User)