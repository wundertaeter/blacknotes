# Generated by Django 4.0.3 on 2022-04-06 08:20

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0019_rename_name_project_title_rename_name_space_title'),
    ]

    operations = [
        migrations.AddField(
            model_name='project',
            name='deadline',
            field=models.DateField(blank=True, null=True),
        ),
    ]