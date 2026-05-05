from django.db import models
from django.conf import settings
from django.core.validators import MinValueValidator, MaxValueValidator
from django.utils import timezone

from common.models import Coordinates


class Toll(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True, null=True, blank=True)
    is_active = models.BooleanField(default=True)
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
    max_speed_kph = models.PositiveSmallIntegerField(
        null=True,
        blank=True,
        validators=[MinValueValidator(30), MaxValueValidator(160)],
    )
    allowed_time_minutes = models.DecimalField(decimal_places=3,max_digits=5,default=0)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['from_toll', 'to_toll'],
                name='unique_toll_connection'
            )
        ]

    def __str__(self):
        return f"{self.from_toll} -> {self.to_toll} ({self.distance_km} km)"

    @property
    def effective_speed_limit_kph(self):
        return self.max_speed_kph or settings.ROADEYE_DEFAULT_SPEED_LIMIT_KPH

    def minimum_allowed_seconds(self):
        speed_limit = max(self.effective_speed_limit_kph, 1)
        return int((self.distance_km / speed_limit) * 3600)



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

    class Meta:
        indexes = [
            models.Index(fields=['toll', 'captured_at']),
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
    speed_limit_kph = models.PositiveSmallIntegerField(null=True, blank=True)
    speed_over_limit_kph = models.FloatField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.vehicle} {self.connection} ({self.observed_duration_seconds}s)"


class Fine(models.Model):
    class Status(models.TextChoices):
        UNPAID = 'unpaid', 'Unpaid'
        PAID = 'paid', 'Paid'
        APPEALED = 'appealed', 'Appealed'
        CANCELLED = 'cancelled', 'Cancelled'

    traversal = models.OneToOneField(
        TollTraversal,
        on_delete=models.PROTECT,
        related_name='fine',
    )
    vehicle = models.ForeignKey(
        'vehicles.Vehicle',
        on_delete=models.PROTECT,
        related_name='fines',
    )
    driver = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='fines',
    )
    reference_number = models.CharField(max_length=30, unique=True)
    base_amount = models.DecimalField(max_digits=10, decimal_places=2)
    discount_percent = models.PositiveSmallIntegerField(default=50)
    discount_deadline = models.DateTimeField()
    issued_at = models.DateTimeField(default=timezone.now)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.UNPAID)
    notes = models.TextField(blank=True)

    class Meta:
        indexes = [
            models.Index(fields=['status', 'issued_at']),
            models.Index(fields=['reference_number']),
        ]

    def __str__(self):
        return f"{self.reference_number} - {self.vehicle}"

    @property
    def discounted_amount(self):
        return self.base_amount * (100 - self.discount_percent) / 100

    def amount_due(self, at_time=None):
        at_time = at_time or timezone.now()
        if at_time <= self.discount_deadline and self.status == self.Status.UNPAID:
            return self.discounted_amount
        return self.base_amount


class Appeal(models.Model):
    class Status(models.TextChoices):
        SUBMITTED = 'submitted', 'Submitted'
        IN_REVIEW = 'in_review', 'In review'
        APPROVED = 'approved', 'Approved'
        REJECTED = 'rejected', 'Rejected'

    fine = models.ForeignKey(Fine, on_delete=models.CASCADE, related_name='appeals')
    submitted_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='appeals',
    )
    reason = models.TextField()
    evidence_url = models.URLField(blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.SUBMITTED)
    admin_response = models.TextField(blank=True)
    reviewed_by = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='reviewed_appeals',
    )
    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Appeal for {self.fine.reference_number} ({self.status})"


class Payment(models.Model):
    class Status(models.TextChoices):
        PENDING = 'pending', 'Pending'
        SUCCEEDED = 'succeeded', 'Succeeded'
        FAILED = 'failed', 'Failed'

    fine = models.ForeignKey(Fine, on_delete=models.PROTECT, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    provider = models.CharField(max_length=40, default='demo_gateway')
    provider_reference = models.CharField(max_length=80, blank=True)
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.PENDING)
    paid_at = models.DateTimeField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    metadata = models.JSONField(default=dict, blank=True)

    def __str__(self):
        return f"{self.fine.reference_number} payment ({self.status})"


class Notification(models.Model):
    class Channel(models.TextChoices):
        EMAIL = 'email', 'Email'
        SMS = 'sms', 'SMS'

    class Status(models.TextChoices):
        QUEUED = 'queued', 'Queued'
        SENT = 'sent', 'Sent'
        FAILED = 'failed', 'Failed'

    fine = models.ForeignKey(Fine, on_delete=models.CASCADE, related_name='notifications')
    recipient = models.CharField(max_length=255)
    channel = models.CharField(max_length=20, choices=Channel.choices)
    subject = models.CharField(max_length=255, blank=True)
    message = models.TextField()
    status = models.CharField(max_length=20, choices=Status.choices, default=Status.QUEUED)
    sent_at = models.DateTimeField(null=True, blank=True)
    error_message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.channel} to {self.recipient} ({self.status})"


class AuditLog(models.Model):
    actor = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='roadeye_audit_logs',
    )
    action = models.CharField(max_length=80)
    entity_type = models.CharField(max_length=80)
    entity_id = models.CharField(max_length=80, blank=True)
    metadata = models.JSONField(default=dict, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        indexes = [
            models.Index(fields=['entity_type', 'entity_id']),
            models.Index(fields=['action', 'created_at']),
        ]

    def __str__(self):
        return f"{self.action} {self.entity_type}:{self.entity_id}"
