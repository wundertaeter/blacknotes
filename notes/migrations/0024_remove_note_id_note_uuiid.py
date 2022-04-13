# Generated by Django 4.0.3 on 2022-04-13 16:37

from django.db import migrations, models
import uuid


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0023_note_anytime_position_note_someday_position_and_more'),
    ]

    operations = [
        migrations.RemoveField(
            model_name='note',
            name='id',
        ),
        migrations.AddField(
            model_name='note',
            name='uuiid',
            field=models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False),
        ),
    ]
