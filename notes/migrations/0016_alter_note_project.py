# Generated by Django 4.0.3 on 2022-03-25 14:22

from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ('notes', '0015_remove_project_default'),
    ]

    operations = [
        migrations.AlterField(
            model_name='note',
            name='project',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.CASCADE, related_name='notes', to='notes.project'),
        ),
    ]
