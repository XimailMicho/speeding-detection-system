from __future__ import annotations

from datetime import timedelta

from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.tolls.models import Toll, TollConnection
from apps.tolls.services import create_capture
from apps.users.models import UserProfile
from apps.vehicles.models import Vehicle
from common.models import Coordinates


class Command(BaseCommand):
    help = "Seed RoadEye demo data: users, vehicles, tolls, connections, captures and fines."

    def handle(self, *args, **options):
        User = get_user_model()
        admin, _ = User.objects.get_or_create(
            username='official@roadeye.local',
            defaults={'email': 'official@roadeye.local', 'first_name': 'RoadEye', 'last_name': 'Official', 'is_staff': True},
        )
        admin.set_password('official123')
        admin.save()
        UserProfile.objects.update_or_create(
            user=admin,
            defaults={'role': UserProfile.Role.OFFICIAL, 'phone_number': '+38970000001'},
        )

        driver, _ = User.objects.get_or_create(
            username='driver@roadeye.local',
            defaults={'email': 'driver@roadeye.local', 'first_name': 'Demo', 'last_name': 'Driver'},
        )
        driver.set_password('driver123')
        driver.save()
        UserProfile.objects.update_or_create(
            user=driver,
            defaults={'role': UserProfile.Role.DRIVER, 'phone_number': '+38970000002'},
        )

        toll_specs = [
            ('Romanovce', 'ROM', 42.0872, 21.7062),
            ('Petrovec', 'PET', 41.9423, 21.6129),
            ('Gradsko', 'GRA', 41.5834, 21.9364),
        ]
        tolls = {}
        for name, code, lat, lng in toll_specs:
            coords, _ = Coordinates.objects.get_or_create(latitude=lat, longitude=lng)
            toll, _ = Toll.objects.update_or_create(
                code=code,
                defaults={'name': name, 'coordinates': coords},
            )
            tolls[code] = toll

        connection, _ = TollConnection.objects.update_or_create(
            from_toll=tolls['ROM'],
            to_toll=tolls['PET'],
            defaults={
                'distance_km': 31.0,
                'max_speed_kph': 100,
                'allowed_time_minutes': 18.6,
            },
        )
        TollConnection.objects.update_or_create(
            from_toll=tolls['PET'],
            to_toll=tolls['GRA'],
            defaults={
                'distance_km': 58.0,
                'max_speed_kph': 100,
                'allowed_time_minutes': 34.8,
            },
        )

        vehicle, _ = Vehicle.objects.update_or_create(
            license_plate='SK-1234-AB',
            defaults={'plate_country': 'MK', 'owner': driver, 'make': 'Volkswagen', 'model': 'Golf', 'color': 'Blue'},
        )

        if not vehicle.captures.exists():
            entry_time = timezone.now() - timedelta(minutes=20)
            create_capture(
                toll=connection.from_toll,
                captured_at=entry_time,
                plate_text=vehicle.license_plate,
                country='MK',
                lane_identifier='A1',
            )
            create_capture(
                toll=connection.to_toll,
                captured_at=entry_time + timedelta(minutes=15),
                plate_text=vehicle.license_plate,
                country='MK',
                lane_identifier='B2',
            )

        self.stdout.write(self.style.SUCCESS('RoadEye demo data seeded.'))
        self.stdout.write('Official: official@roadeye.local / official123')
        self.stdout.write('Driver: driver@roadeye.local / driver123')
