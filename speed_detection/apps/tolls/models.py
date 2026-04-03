from django.db import models

# Create your models here.
from django.db import models
from common.models import Coordinates


class Toll(models.Model):
    name = models.CharField(max_length=100)
    coordinates = models.OneToOneField(
        Coordinates,
        on_delete=models.CASCADE,
        related_name='toll'
    )

    def __str__(self):
        return self.name


class TollConnection(models.Model):
    from_toll = models.ForeignKey(
        Toll,
        on_delete=models.CASCADE,
        related_name='connections_from'
    )
    to_toll = models.ForeignKey(
        Toll,
        on_delete=models.CASCADE,
        related_name='connections_to'
    )
    distance_km = models.FloatField()

    def __str__(self):
        return f"{self.from_toll} -> {self.to_toll} ({self.distance_km} km)"

