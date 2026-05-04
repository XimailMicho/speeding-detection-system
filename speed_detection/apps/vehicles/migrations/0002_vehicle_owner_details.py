# Generated for RoadEye backend completion.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('vehicles', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='vehicle',
            name='color',
            field=models.CharField(blank=True, max_length=40),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='make',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='model',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='owner',
            field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='vehicles', to=settings.AUTH_USER_MODEL),
        ),
        migrations.AddField(
            model_name='vehicle',
            name='registration_expires_at',
            field=models.DateField(blank=True, null=True),
        ),
    ]
