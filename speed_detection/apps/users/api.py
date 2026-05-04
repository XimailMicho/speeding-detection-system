from __future__ import annotations

import json

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_http_methods, require_POST

from apps.users.models import UserProfile


def body_json(request):
    if not request.body:
        return {}
    try:
        return json.loads(request.body.decode('utf-8'))
    except json.JSONDecodeError:
        return None


def profile_json(user):
    profile, _created = UserProfile.objects.get_or_create(user=user)
    return {
        'id': user.id,
        'username': user.username,
        'email': user.email,
        'first_name': user.first_name,
        'last_name': user.last_name,
        'is_staff': user.is_staff,
        'role': profile.role,
        'phone_number': profile.phone_number,
    }


@require_http_methods(['POST'])
@csrf_exempt
def register(request):
    data = body_json(request)
    if data is None:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
    username = data.get('username') or data.get('email')
    password = data.get('password')
    if not username or not password:
        return JsonResponse({'error': 'Username/email and password are required.'}, status=400)

    User = get_user_model()
    if User.objects.filter(username=username).exists():
        return JsonResponse({'error': 'User already exists.'}, status=400)
    user = User.objects.create_user(
        username=username,
        email=data.get('email', username if '@' in username else ''),
        password=password,
        first_name=data.get('first_name', ''),
        last_name=data.get('last_name', ''),
    )
    UserProfile.objects.create(
        user=user,
        role=data.get('role', UserProfile.Role.DRIVER),
        phone_number=data.get('phone_number', ''),
        national_id=data.get('national_id', ''),
    )
    login(request, user)
    return JsonResponse({'user': profile_json(user)}, status=201)


@require_POST
@csrf_exempt
def login_view(request):
    data = body_json(request)
    if data is None:
        return JsonResponse({'error': 'Invalid JSON body.'}, status=400)
    user = authenticate(request, username=data.get('username') or data.get('email'), password=data.get('password'))
    if not user:
        return JsonResponse({'error': 'Invalid credentials.'}, status=400)
    login(request, user)
    return JsonResponse({'user': profile_json(user)})


@require_POST
@csrf_exempt
def logout_view(request):
    logout(request)
    return JsonResponse({'ok': True})


@require_http_methods(['GET'])
def me(request):
    if not request.user.is_authenticated:
        return JsonResponse({'authenticated': False}, status=401)
    return JsonResponse({'authenticated': True, 'user': profile_json(request.user)})
