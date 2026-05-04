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
    max_speed_kph = models.PositiveSmallIntegerField(null=True, blank=True)
    maps_distance_meters = models.PositiveIntegerField(null=True, blank=True)
    maps_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    maps_duration_in_traffic_seconds = models.PositiveIntegerField(null=True, blank=True)
    maps_last_synced_at = models.DateTimeField(null=True, blank=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['from_toll', 'to_toll'],
                name='unique_toll_connection'
            )
        ]

    def __str__(self):
        return f"{self.from_toll} -> {self.to_toll} ({self.distance_km} km)"


class TollConnectionDailyTime(models.Model):
    connection = models.ForeignKey(
        TollConnection,
        on_delete=models.CASCADE,
        related_name='daily_times'
    )
    date = models.DateField()
    expected_duration_seconds = models.PositiveIntegerField()
    expected_duration_in_traffic_seconds = models.PositiveIntegerField(null=True, blank=True)
    distance_meters = models.PositiveIntegerField(null=True, blank=True)
    source = models.CharField(max_length=40, default='maps_distance_matrix')
    calculated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['connection', 'date'],
                name='unique_connection_daily_time'
            )
        ]
        indexes = [
            models.Index(fields=['connection', 'date']),
        ]

    def __str__(self):
        return f"{self.connection} @ {self.date}"


class TollCapture(models.Model):
    toll = models.ForeignKey(
        Toll,
        on_delete=models.CASCADE,
        related_name='captures'
    )
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='captures'
    )
    plate_text = models.CharField(max_length=20, blank=True)
    captured_at = models.DateTimeField(db_index=True)
    image_path = models.CharField(max_length=255, blank=True)
    ocr_confidence = models.FloatField(null=True, blank=True)
    lane_identifier = models.CharField(max_length=20, blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['toll', 'captured_at']),
            models.Index(fields=['plate_text', 'captured_at']),
        ]

    def __str__(self):
        plate = self.plate_text or "UNKNOWN"
        return f"{self.toll} @ {self.captured_at} ({plate})"


class TollTraversal(models.Model):
    entry_capture = models.OneToOneField(
        TollCapture,
        on_delete=models.CASCADE,
        related_name='as_entry'
    )
    exit_capture = models.OneToOneField(
        TollCapture,
        on_delete=models.CASCADE,
        related_name='as_exit'
    )
    connection = models.ForeignKey(
        TollConnection,
        on_delete=models.PROTECT,
        related_name='traversals'
    )
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.PROTECT,
        related_name='traversals'
    )
    observed_duration_seconds = models.PositiveIntegerField()
    expected_duration_seconds = models.PositiveIntegerField(null=True, blank=True)
    average_speed_kph = models.FloatField(null=True, blank=True)
    is_speeding = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle} {self.connection} ({self.observed_duration_seconds}s)"
