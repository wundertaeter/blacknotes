# Generated by Django 4.0.3 on 2022-03-21 12:46

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0006_alter_project_name_alter_space_name'),
    ]

    operations = [
        migrations.AlterField(
            model_name='project',
            name='default',
            field=models.BooleanField(blank=True, default=False, null=True),
        ),
        migrations.AlterField(
            model_name='project',
            name='icon',
            field=models.CharField(blank=True, default='radio_button_unchecked', max_length=64, null=True),
        ),
        migrations.AlterField(
            model_name='space',
            name='icon',
            field=models.CharField(blank=True, default='view_in_ar', max_length=64, null=True),
        ),
    ]
