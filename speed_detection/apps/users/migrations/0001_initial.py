# Generated for RoadEye backend completion.

import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.CreateModel(
            name='UserProfile',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('role', models.CharField(choices=[('driver', 'Driver'), ('official', 'Traffic official'), ('admin', 'Administrator')], default='driver', max_length=20)),
                ('phone_number', models.CharField(blank=True, max_length=30)),
                ('national_id', models.CharField(blank=True, max_length=40)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('updated_at', models.DateTimeField(auto_now=True)),
                ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='roadeye_profile', to=settings.AUTH_USER_MODEL)),
            ],
        ),
    ]
