from django.db import models
from django.contrib.auth.models import User


class Space(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='spaces')
    title = models.CharField(max_length=128, null=True, blank=True)
    icon = models.CharField(max_length=64, default="view_in_ar")
    position = models.IntegerField()
    deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

class Project(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='projects')
    title = models.CharField(max_length=128, null=True, blank=True)
    icon = models.CharField(max_length=64, default="radio_button_unchecked")
    space = models.ForeignKey(Space, null=True, blank=True, on_delete=models.CASCADE, related_name='projects')
    position = models.IntegerField(null=True, blank=True)
    upcoming_position = models.IntegerField(null=True, blank=True)
    today_position = models.IntegerField(null=True, blank=True)
    done = models.BooleanField(default=False)
    deadline = models.DateField(null=True, blank=True)
    completed_at = models.DateField(null=True, blank=True)
    deleted = models.BooleanField(default=False)
    deleted_at = models.DateTimeField(null=True, blank=True)

class Note(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notes')
    content = models.TextField()
    title = models.CharField(max_length=256)
    position = models.IntegerField(null=True, blank=True)
    upcoming_position = models.IntegerField(null=True, blank=True)
    today_position = models.IntegerField(null=True, blank=True)
    project = models.ForeignKey(Project, null=True, blank=True, on_delete=models.CASCADE, related_name='notes')
    deleted = models.BooleanField(default=False)
    done = models.BooleanField(default=False)
    completed_at = models.DateField(null=True, blank=True)
    deadline = models.DateField(null=True, blank=True)
    deleted_at = models.DateTimeField(null=True, blank=True)