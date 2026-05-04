from django.db import models
from django.conf import settings


class Vehicle(models.Model):
	license_plate = models.CharField(max_length=20, unique=True)
	plate_country = models.CharField(max_length=2, blank=True)
	owner = models.ForeignKey(
		settings.AUTH_USER_MODEL,
		on_delete=models.SET_NULL,
		null=True,
		blank=True,
		related_name='vehicles',
	)
	make = models.CharField(max_length=80, blank=True)
	model = models.CharField(max_length=80, blank=True)
	color = models.CharField(max_length=40, blank=True)
	registration_expires_at = models.DateField(null=True, blank=True)
	is_active = models.BooleanField(default=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		suffix = f" ({self.plate_country})" if self.plate_country else ""
		return f"{self.license_plate}{suffix}"
