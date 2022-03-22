# Generated by Django 4.0.3 on 2022-03-22 09:04

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0013_alter_note_deleted_alter_note_done_and_more'),
    ]

    operations = [
        migrations.AlterField(
            model_name='note',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='note',
            name='done',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='project',
            name='default',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='project',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='project',
            name='done',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='project',
            name='icon',
            field=models.CharField(default='radio_button_unchecked', max_length=64),
        ),
        migrations.AlterField(
            model_name='space',
            name='deleted',
            field=models.BooleanField(default=False),
        ),
        migrations.AlterField(
            model_name='space',
            name='icon',
            field=models.CharField(default='view_in_ar', max_length=64),
        ),
    ]