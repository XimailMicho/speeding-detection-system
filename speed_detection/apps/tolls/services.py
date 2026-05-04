from __future__ import annotations

from datetime import timedelta
from decimal import Decimal
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.mail import send_mail
from django.db import transaction
from django.db.models import Count, Q, Sum
from django.utils import timezone

from apps.tolls.models import (
    Appeal,
    AuditLog,
    Fine,
    Notification,
    Payment,
    TollCapture,
    TollConnection,
    TollConnectionDailyTime,
    TollTraversal,
)
from apps.vehicles.models import Vehicle


def normalize_plate(plate_text: str) -> str:
    return ''.join(ch for ch in (plate_text or '').upper() if ch.isalnum() or ch in {'-', ' '}).strip()


def expected_duration_for(connection: TollConnection, at_time) -> int:
    daily_time = TollConnectionDailyTime.objects.filter(
        connection=connection,
        date=at_time.date(),
    ).first()
    if daily_time:
        return daily_time.expected_duration_in_traffic_seconds or daily_time.expected_duration_seconds
    if connection.maps_duration_in_traffic_seconds:
        return connection.maps_duration_in_traffic_seconds
    if connection.maps_duration_seconds:
        return connection.maps_duration_seconds
    return connection.minimum_allowed_seconds()


def calculate_average_speed(distance_km: float, observed_seconds: int) -> float:
    if observed_seconds <= 0:
        return 0
    return round(distance_km / (observed_seconds / 3600), 2)


def calculate_fine_amount(speed_over_limit_kph: float) -> Decimal:
    if speed_over_limit_kph >= 50:
        return Decimal('300.00')
    if speed_over_limit_kph >= 30:
        return Decimal('220.00')
    if speed_over_limit_kph >= 15:
        return Decimal('150.00')
    return Decimal('90.00')


def build_reference_number(fine_id: int) -> str:
    return f"RE-{timezone.now().year}-{fine_id:06d}"


def create_fine_for_traversal(traversal: TollTraversal) -> Fine | None:
    if not traversal.is_speeding:
        return None
    existing = Fine.objects.filter(traversal=traversal).first()
    if existing:
        return existing

    now = timezone.now()
    fine = Fine.objects.create(
        traversal=traversal,
        vehicle=traversal.vehicle,
        driver=traversal.vehicle.owner,
        reference_number=f"RE-TMP-{traversal.id}",
        base_amount=calculate_fine_amount(traversal.speed_over_limit_kph),
        discount_percent=settings.ROADEYE_FAST_PAYMENT_DISCOUNT_PERCENT,
        discount_deadline=now + timedelta(days=settings.ROADEYE_FAST_PAYMENT_DAYS),
        due_at=now + timedelta(days=30),
        notes=(
            f"Average speed {traversal.average_speed_kph} km/h on "
            f"{traversal.connection.from_toll} -> {traversal.connection.to_toll}."
        ),
    )
    fine.reference_number = build_reference_number(fine.id)
    fine.save(update_fields=['reference_number'])
    send_fine_notifications(fine)
    return fine


@transaction.atomic
def create_capture(
    *,
    toll,
    captured_at,
    plate_text='',
    image_path='',
    ocr_confidence=None,
    lane_identifier='',
    country='',
    raw_ocr_payload=None,
) -> TollCapture:
    plate_text = normalize_plate(plate_text)
    vehicle = None
    if plate_text:
        vehicle, _created = Vehicle.objects.get_or_create(
            license_plate=plate_text,
            defaults={'plate_country': country},
        )

    capture = TollCapture.objects.create(
        toll=toll,
        vehicle=vehicle,
        plate_text=plate_text,
        captured_at=captured_at,
        image_path=image_path,
        ocr_confidence=ocr_confidence,
        lane_identifier=lane_identifier,
        raw_ocr_payload=raw_ocr_payload or {},
    )
    if vehicle:
        try_create_traversal_for_capture(capture)
    return capture


@transaction.atomic
def try_create_traversal_for_capture(exit_capture: TollCapture) -> TollTraversal | None:
    if not exit_capture.vehicle:
        return None

    entry_capture = (
        TollCapture.objects
        .filter(
            vehicle=exit_capture.vehicle,
            captured_at__lt=exit_capture.captured_at,
        )
        .exclude(toll=exit_capture.toll)
        .exclude(as_entry__isnull=False)
        .order_by('-captured_at')
        .first()
    )
    if not entry_capture:
        return None

    connection = TollConnection.objects.filter(
        from_toll=entry_capture.toll,
        to_toll=exit_capture.toll,
    ).first()
    if not connection:
        return None

    observed_seconds = int((exit_capture.captured_at - entry_capture.captured_at).total_seconds())
    if observed_seconds <= 0:
        return None

    speed_limit = connection.effective_speed_limit_kph
    average_speed = calculate_average_speed(connection.distance_km, observed_seconds)
    expected_seconds = expected_duration_for(connection, exit_capture.captured_at)
    speed_over = max(Decimal(str(average_speed)) - Decimal(speed_limit + connection.tolerance_kph), Decimal('0'))
    is_speeding = average_speed > (speed_limit + connection.tolerance_kph) or observed_seconds < expected_seconds

    traversal = TollTraversal.objects.create(
        entry_capture=entry_capture,
        exit_capture=exit_capture,
        connection=connection,
        vehicle=exit_capture.vehicle,
        observed_duration_seconds=observed_seconds,
        expected_duration_seconds=expected_seconds,
        average_speed_kph=average_speed,
        is_speeding=is_speeding,
        speed_limit_kph=speed_limit,
        speed_over_limit_kph=float(speed_over),
    )
    create_fine_for_traversal(traversal)
    return traversal


def read_plate_from_image(image_path: str) -> tuple[str, float | None, dict]:
    try:
        from services.recognition.plate_ocr import PlateOcr
    except Exception as exc:
        return '', None, {'fallback': True, 'error': str(exc)}

    path = Path(image_path)
    if not path.exists():
        return '', None, {'fallback': True, 'error': f'Image not found: {image_path}'}

    try:
        plate_text, confidence, candidates = PlateOcr().read_plate(str(path))
    except Exception as exc:
        return '', None, {'fallback': True, 'error': str(exc)}

    return normalize_plate(plate_text), confidence, {'candidates': candidates}


def send_fine_notifications(fine: Fine) -> list[Notification]:
    notifications = []
    user = fine.driver
    amount = fine.amount_due()
    message = (
        f"RoadEye fine {fine.reference_number}: detected speeding for vehicle "
        f"{fine.vehicle.license_plate}. Amount due: {amount} EUR. "
        f"Pay within {settings.ROADEYE_FAST_PAYMENT_DAYS} days for "
        f"{fine.discount_percent}% discount."
    )
    if user and user.email:
        notification = Notification.objects.create(
            fine=fine,
            recipient=user.email,
            channel=Notification.Channel.EMAIL,
            subject=f"RoadEye fine {fine.reference_number}",
            message=message,
        )
        try:
            send_mail(
                notification.subject,
                notification.message,
                settings.DEFAULT_FROM_EMAIL,
                [notification.recipient],
                fail_silently=False,
            )
            notification.status = Notification.Status.SENT
            notification.sent_at = timezone.now()
        except Exception as exc:
            notification.status = Notification.Status.FAILED
            notification.error_message = str(exc)
        notification.save(update_fields=['status', 'sent_at', 'error_message'])
        notifications.append(notification)

    phone_number = getattr(getattr(user, 'roadeye_profile', None), 'phone_number', '') if user else ''
    if phone_number:
        notification = Notification.objects.create(
            fine=fine,
            recipient=phone_number,
            channel=Notification.Channel.SMS,
            message=message,
            status=Notification.Status.SENT,
            sent_at=timezone.now(),
        )
        notifications.append(notification)
    return notifications


@transaction.atomic
def submit_appeal(*, fine: Fine, user, reason: str, evidence_url: str = '') -> Appeal:
    appeal = Appeal.objects.create(
        fine=fine,
        submitted_by=user if user and user.is_authenticated else None,
        reason=reason,
        evidence_url=evidence_url,
    )
    fine.status = Fine.Status.APPEALED
    fine.save(update_fields=['status'])
    return appeal


@transaction.atomic
def review_appeal(*, appeal: Appeal, reviewer, status: str, response: str = '') -> Appeal:
    appeal.status = status
    appeal.admin_response = response
    appeal.reviewed_by = reviewer if reviewer and reviewer.is_authenticated else None
    appeal.reviewed_at = timezone.now()
    appeal.save(update_fields=['status', 'admin_response', 'reviewed_by', 'reviewed_at'])

    if status == Appeal.Status.APPROVED:
        appeal.fine.status = Fine.Status.CANCELLED
        appeal.fine.save(update_fields=['status'])
    elif status == Appeal.Status.REJECTED:
        appeal.fine.status = Fine.Status.UNPAID
        appeal.fine.save(update_fields=['status'])
    return appeal


@transaction.atomic
def pay_fine(*, fine: Fine, provider='demo_gateway', provider_reference='', metadata=None) -> Payment:
    amount = fine.amount_due()
    payment = Payment.objects.create(
        fine=fine,
        amount=amount,
        provider=provider,
        provider_reference=provider_reference,
        status=Payment.Status.SUCCEEDED,
        paid_at=timezone.now(),
        metadata=metadata or {},
    )
    fine.status = Fine.Status.PAID
    fine.save(update_fields=['status'])
    return payment


def admin_statistics():
    fines = Fine.objects.all()
    paid = fines.filter(status=Fine.Status.PAID)
    return {
        'total_fines': fines.count(),
        'unpaid_fines': fines.filter(status=Fine.Status.UNPAID).count(),
        'paid_fines': paid.count(),
        'appealed_fines': fines.filter(status=Fine.Status.APPEALED).count(),
        'cancelled_fines': fines.filter(status=Fine.Status.CANCELLED).count(),
        'total_revenue': str(Payment.objects.filter(status=Payment.Status.SUCCEEDED).aggregate(
            total=Sum('amount'),
        )['total'] or Decimal('0.00')),
        'pending_appeals': Appeal.objects.filter(
            status__in=[Appeal.Status.SUBMITTED, Appeal.Status.IN_REVIEW],
        ).count(),
        'captures_today': TollCapture.objects.filter(captured_at__date=timezone.localdate()).count(),
        'violations_by_status': list(fines.values('status').annotate(count=Count('id')).order_by('status')),
        'notifications': list(Notification.objects.values('channel', 'status').annotate(count=Count('id'))),
    }


def user_statistics(user):
    user_fines = Fine.objects.filter(Q(driver=user) | Q(vehicle__owner=user)).distinct()
    return {
        'total_fines': user_fines.count(),
        'unpaid_fines': user_fines.filter(status=Fine.Status.UNPAID).count(),
        'paid_fines': user_fines.filter(status=Fine.Status.PAID).count(),
        'appealed_fines': user_fines.filter(status=Fine.Status.APPEALED).count(),
        'amount_due': str(sum((fine.amount_due() for fine in user_fines.filter(status=Fine.Status.UNPAID)), Decimal('0.00'))),
    }


def audit(actor, action: str, entity, metadata=None):
    AuditLog.objects.create(
        actor=actor if actor and actor.is_authenticated else None,
        action=action,
        entity_type=entity.__class__.__name__,
        entity_id=str(getattr(entity, 'id', '')),
        metadata=metadata or {},
    )
