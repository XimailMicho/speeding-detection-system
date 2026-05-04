from django.db import models


class Vehicle(models.Model):
	license_plate = models.CharField(max_length=20, unique=True)
	plate_country = models.CharField(max_length=2, blank=True)
	created_at = models.DateTimeField(auto_now_add=True)
	updated_at = models.DateTimeField(auto_now=True)

	def __str__(self):
		suffix = f" ({self.plate_country})" if self.plate_country else ""
		return f"{self.license_plate}{suffix}"
