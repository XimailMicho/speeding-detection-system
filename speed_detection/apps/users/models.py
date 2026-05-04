from django.conf import settings
from django.db import models


class UserProfile(models.Model):
    class Role(models.TextChoices):
        DRIVER = 'driver', 'Driver'
        OFFICIAL = 'official', 'Traffic official'
        ADMIN = 'admin', 'Administrator'

    user = models.OneToOneField(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name='roadeye_profile',
    )
    role = models.CharField(max_length=20, choices=Role.choices, default=Role.DRIVER)
    phone_number = models.CharField(max_length=30, blank=True)
    national_id = models.CharField(max_length=40, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.user.get_username()} ({self.role})"
