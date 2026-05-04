from __future__ import annotations

import json
from datetime import datetime

from django.contrib.auth.decorators import login_required, user_passes_test
from django.http import JsonResponse
from django.shortcuts import get_object_or_404
from django.utils import timezone
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST

from apps.tolls.models import Appeal, Fine, Toll, TollCapture, TollConnection, TollTraversal
from apps.tolls.services import (
    admin_statistics,
    audit,
    create_capture,
    pay_fine,
    read_plate_from_image,
    review_appeal,
    submit_appeal,
    user_statistics,
)
from apps.vehicles.models import Vehicle
from common.models import Coordinates


def parse_body(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return None


def bad_request(message, status=400):
    return JsonResponse({'error': message}, status=status)


def is_official(user):
    if not user.is_authenticated:
        return False
    profile = getattr(user, 'roadeye_profile', None)
    return user.is_staff or user.is_superuser or (profile and profile.role in {'official', 'admin'})


def parse_datetime(value):
    if not value:
        return timezone.now()
    parsed = datetime.fromisoformat(value.replace('Z', '+00:00'))
    if timezone.is_naive(parsed):
        return timezone.make_aware(parsed, timezone.get_current_timezone())
    return parsed


def toll_json(toll):
    return {
        'id': toll.id,
        'name': toll.name,
        'code': toll.code,
        'city': toll.city,
        'road_name': toll.road_name,
        'is_active': toll.is_active,
        'coordinates': {
            'latitude': toll.coordinates.latitude,
            'longitude': toll.coordinates.longitude,
        },
    }


def connection_json(connection):
    return {
        'id': connection.id,
        'from_toll': toll_json(connection.from_toll),
        'to_toll': toll_json(connection.to_toll),
        'distance_km': connection.distance_km,
        'speed_limit_kph': connection.effective_speed_limit_kph,
        'tolerance_kph': connection.tolerance_kph,
        'minimum_allowed_seconds': connection.minimum_allowed_seconds(),
        'maps_distance_meters': connection.maps_distance_meters,
        'maps_duration_seconds': connection.maps_duration_seconds,
        'maps_duration_in_traffic_seconds': connection.maps_duration_in_traffic_seconds,
        'maps_last_synced_at': connection.maps_last_synced_at.isoformat() if connection.maps_last_synced_at else None,
    }


def capture_json(capture):
    return {
        'id': capture.id,
        'toll': toll_json(capture.toll),
        'vehicle_id': capture.vehicle_id,
        'plate_text': capture.plate_text,
        'captured_at': capture.captured_at.isoformat(),
        'image_path': capture.image_path,
        'ocr_confidence': capture.ocr_confidence,
        'lane_identifier': capture.lane_identifier,
    }


def traversal_json(traversal):
    return {
        'id': traversal.id,
        'entry_capture': capture_json(traversal.entry_capture),
        'exit_capture': capture_json(traversal.exit_capture),
        'connection': connection_json(traversal.connection),
        'vehicle': vehicle_json(traversal.vehicle),
        'observed_duration_seconds': traversal.observed_duration_seconds,
        'expected_duration_seconds': traversal.expected_duration_seconds,
        'average_speed_kph': traversal.average_speed_kph,
        'speed_limit_kph': traversal.speed_limit_kph,
        'speed_over_limit_kph': traversal.speed_over_limit_kph,
        'is_speeding': traversal.is_speeding,
        'fine_id': getattr(traversal, 'fine', None).id if hasattr(traversal, 'fine') else None,
    }


def vehicle_json(vehicle):
    return {
        'id': vehicle.id,
        'license_plate': vehicle.license_plate,
        'plate_country': vehicle.plate_country,
        'owner_id': vehicle.owner_id,
        'make': vehicle.make,
        'model': vehicle.model,
        'color': vehicle.color,
        'registration_expires_at': vehicle.registration_expires_at.isoformat() if vehicle.registration_expires_at else None,
        'is_active': vehicle.is_active,
    }


def fine_json(fine):
    return {
        'id': fine.id,
        'reference_number': fine.reference_number,
        'vehicle': vehicle_json(fine.vehicle),
        'driver_id': fine.driver_id,
        'traversal': traversal_json(fine.traversal),
        'base_amount': str(fine.base_amount),
        'amount_due': str(fine.amount_due()),
        'discount_percent': fine.discount_percent,
        'discount_deadline': fine.discount_deadline.isoformat(),
        'issued_at': fine.issued_at.isoformat(),
        'due_at': fine.due_at.isoformat(),
        'status': fine.status,
        'notes': fine.notes,
    }


def appeal_json(appeal):
    return {
        'id': appeal.id,
        'fine_id': appeal.fine_id,
        'reference_number': appeal.fine.reference_number,
        'submitted_by_id': appeal.submitted_by_id,
        'reason': appeal.reason,
        'evidence_url': appeal.evidence_url,
        'status': appeal.status,
        'admin_response': appeal.admin_response,
        'reviewed_by_id': appeal.reviewed_by_id,
        'submitted_at': appeal.submitted_at.isoformat(),
        'reviewed_at': appeal.reviewed_at.isoformat() if appeal.reviewed_at else None,
    }


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def tolls(request):
    if request.method == 'GET':
        return JsonResponse({'results': [toll_json(toll) for toll in Toll.objects.select_related('coordinates').all()]})

    if not is_official(request.user):
        return bad_request('Official role is required.', 403)
    body = parse_body(request)
    if body is None:
        return bad_request('Invalid JSON body.')
    coordinates = Coordinates.objects.create(
        latitude=body.get('latitude'),
        longitude=body.get('longitude'),
    )
    toll = Toll.objects.create(
        name=body.get('name', ''),
        code=body.get('code') or None,
        city=body.get('city', ''),
        road_name=body.get('road_name', ''),
        coordinates=coordinates,
    )
    audit(request.user, 'create_toll', toll)
    return JsonResponse(toll_json(toll), status=201)


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def connections(request):
    if request.method == 'GET':
        qs = TollConnection.objects.select_related('from_toll__coordinates', 'to_toll__coordinates')
        return JsonResponse({'results': [connection_json(connection) for connection in qs]})

    if not is_official(request.user):
        return bad_request('Official role is required.', 403)
    body = parse_body(request)
    if body is None:
        return bad_request('Invalid JSON body.')
    connection = TollConnection.objects.create(
        from_toll_id=body.get('from_toll_id'),
        to_toll_id=body.get('to_toll_id'),
        distance_km=body.get('distance_km'),
        max_speed_kph=body.get('max_speed_kph'),
        tolerance_kph=body.get('tolerance_kph', 5),
        maps_distance_meters=body.get('maps_distance_meters'),
        maps_duration_seconds=body.get('maps_duration_seconds'),
        maps_duration_in_traffic_seconds=body.get('maps_duration_in_traffic_seconds'),
        maps_last_synced_at=timezone.now() if body.get('maps_distance_meters') else None,
    )
    audit(request.user, 'create_connection', connection)
    return JsonResponse(connection_json(connection), status=201)


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def vehicles(request):
    if request.method == 'GET':
        qs = Vehicle.objects.all()
        if request.user.is_authenticated and not is_official(request.user):
            qs = qs.filter(owner=request.user)
        return JsonResponse({'results': [vehicle_json(vehicle) for vehicle in qs]})

    if not request.user.is_authenticated:
        return bad_request('Authentication is required.', 403)
    body = parse_body(request)
    if body is None:
        return bad_request('Invalid JSON body.')
    vehicle, _created = Vehicle.objects.update_or_create(
        license_plate=body.get('license_plate', '').upper(),
        defaults={
            'plate_country': body.get('plate_country', ''),
            'owner': request.user if not is_official(request.user) else None,
            'make': body.get('make', ''),
            'model': body.get('model', ''),
            'color': body.get('color', ''),
        },
    )
    audit(request.user, 'upsert_vehicle', vehicle)
    return JsonResponse(vehicle_json(vehicle), status=201)


@require_POST
@csrf_exempt
def captures(request):
    if not is_official(request.user):
        return bad_request('Official role is required.', 403)
    body = parse_body(request)
    if body is None:
        return bad_request('Invalid JSON body.')

    plate_text = body.get('plate_text', '')
    ocr_confidence = body.get('ocr_confidence')
    raw_payload = {}
    image_path = body.get('image_path', '')
    if image_path and not plate_text:
        plate_text, ocr_confidence, raw_payload = read_plate_from_image(image_path)

    capture = create_capture(
        toll=get_object_or_404(Toll, pk=body.get('toll_id')),
        captured_at=parse_datetime(body.get('captured_at')),
        plate_text=plate_text,
        image_path=image_path,
        ocr_confidence=ocr_confidence,
        lane_identifier=body.get('lane_identifier', ''),
        country=body.get('country', ''),
        raw_ocr_payload=raw_payload,
    )
    audit(request.user, 'create_capture', capture)
    traversal = getattr(capture, 'as_exit', None)
    return JsonResponse({
        'capture': capture_json(capture),
        'traversal': traversal_json(traversal) if traversal else None,
        'fine': fine_json(traversal.fine) if traversal and hasattr(traversal, 'fine') else None,
    }, status=201)


@require_http_methods(['GET'])
def traversals(request):
    if not is_official(request.user):
        return bad_request('Official role is required.', 403)
    qs = TollTraversal.objects.select_related(
        'vehicle',
        'connection__from_toll__coordinates',
        'connection__to_toll__coordinates',
        'entry_capture__toll__coordinates',
        'exit_capture__toll__coordinates',
    ).order_by('-created_at')[:200]
    return JsonResponse({'results': [traversal_json(item) for item in qs]})


@require_http_methods(['GET'])
def fines(request):
    if not request.user.is_authenticated:
        return bad_request('Authentication is required.', 403)
    qs = Fine.objects.select_related(
        'vehicle',
        'traversal__entry_capture__toll__coordinates',
        'traversal__exit_capture__toll__coordinates',
        'traversal__connection__from_toll__coordinates',
        'traversal__connection__to_toll__coordinates',
    ).order_by('-issued_at')
    if not is_official(request.user):
        qs = qs.filter(driver=request.user)
    return JsonResponse({'results': [fine_json(fine) for fine in qs[:200]]})


@require_http_methods(['GET'])
def fine_detail(request, fine_id):
    fine = get_object_or_404(Fine, pk=fine_id)
    if not is_official(request.user) and fine.driver_id != request.user.id:
        return bad_request('You cannot access this fine.', 403)
    return JsonResponse(fine_json(fine))


@require_POST
@csrf_exempt
def fine_payment(request, fine_id):
    fine = get_object_or_404(Fine, pk=fine_id)
    if not is_official(request.user) and fine.driver_id != request.user.id:
        return bad_request('You cannot pay this fine.', 403)
    if fine.status == Fine.Status.PAID:
        return bad_request('Fine is already paid.')
    body = parse_body(request) or {}
    payment = pay_fine(
        fine=fine,
        provider=body.get('provider', 'demo_gateway'),
        provider_reference=body.get('provider_reference', ''),
        metadata=body.get('metadata', {}),
    )
    audit(request.user, 'pay_fine', payment)
    return JsonResponse({
        'payment': {
            'id': payment.id,
            'fine_id': payment.fine_id,
            'amount': str(payment.amount),
            'provider': payment.provider,
            'provider_reference': payment.provider_reference,
            'status': payment.status,
            'paid_at': payment.paid_at.isoformat() if payment.paid_at else None,
        },
        'fine': fine_json(fine),
    }, status=201)


@require_http_methods(['GET', 'POST'])
@csrf_exempt
def appeals(request):
    if request.method == 'GET':
        if not request.user.is_authenticated:
            return bad_request('Authentication is required.', 403)
        qs = Appeal.objects.select_related('fine')
        if not is_official(request.user):
            qs = qs.filter(submitted_by=request.user)
        return JsonResponse({'results': [appeal_json(appeal) for appeal in qs.order_by('-submitted_at')[:200]]})

    if not request.user.is_authenticated:
        return bad_request('Authentication is required.', 403)
    body = parse_body(request)
    if body is None:
        return bad_request('Invalid JSON body.')
    fine = get_object_or_404(Fine, pk=body.get('fine_id'))
    if not is_official(request.user) and fine.driver_id != request.user.id:
        return bad_request('You cannot appeal this fine.', 403)
    appeal = submit_appeal(
        fine=fine,
        user=request.user,
        reason=body.get('reason', ''),
        evidence_url=body.get('evidence_url', ''),
    )
    audit(request.user, 'submit_appeal', appeal)
    return JsonResponse(appeal_json(appeal), status=201)


@require_POST
@csrf_exempt
def appeal_review(request, appeal_id):
    if not is_official(request.user):
        return bad_request('Official role is required.', 403)
    body = parse_body(request)
    if body is None:
        return bad_request('Invalid JSON body.')
    status = body.get('status')
    if status not in {Appeal.Status.APPROVED, Appeal.Status.REJECTED, Appeal.Status.IN_REVIEW}:
        return bad_request('Invalid appeal status.')
    appeal = review_appeal(
        appeal=get_object_or_404(Appeal, pk=appeal_id),
        reviewer=request.user,
        status=status,
        response=body.get('admin_response', ''),
    )
    audit(request.user, 'review_appeal', appeal)
    return JsonResponse(appeal_json(appeal))


@require_http_methods(['GET'])
def statistics(request):
    if not request.user.is_authenticated:
        return bad_request('Authentication is required.', 403)
    data = admin_statistics() if is_official(request.user) else user_statistics(request.user)
    return JsonResponse(data)
