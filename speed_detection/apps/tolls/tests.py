from datetime import timedelta

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone

from apps.tolls.models import Fine, Toll, TollConnection
from apps.tolls.services import create_capture
from apps.vehicles.models import Vehicle
from common.models import Coordinates


class SpeedDetectionTests(TestCase):
    def setUp(self):
        User = get_user_model()
        self.driver = User.objects.create_user(
            username='driver@example.com',
            email='driver@example.com',
            password='secret',
        )
        self.vehicle = Vehicle.objects.create(
            license_plate='SK-1234-AB',
            plate_country='MK',
            owner=self.driver,
        )
        self.entry_toll = Toll.objects.create(
            name='Romanovce',
            code='ROM',
            coordinates=Coordinates.objects.create(latitude=42.08, longitude=21.70),
        )
        self.exit_toll = Toll.objects.create(
            name='Petrovec',
            code='PET',
            coordinates=Coordinates.objects.create(latitude=41.94, longitude=21.61),
        )
        self.connection = TollConnection.objects.create(
            from_toll=self.entry_toll,
            to_toll=self.exit_toll,
            distance_km=30,
            max_speed_kph=100,
            tolerance_kph=5,
        )

    def test_fast_traversal_generates_fine_with_discount(self):
        started_at = timezone.now() - timedelta(minutes=20)
        create_capture(
            toll=self.entry_toll,
            captured_at=started_at,
            plate_text=self.vehicle.license_plate,
            country='MK',
        )
        create_capture(
            toll=self.exit_toll,
            captured_at=started_at + timedelta(minutes=12),
            plate_text=self.vehicle.license_plate,
            country='MK',
        )

        fine = Fine.objects.get()
        self.assertEqual(fine.driver, self.driver)
        self.assertEqual(fine.status, Fine.Status.UNPAID)
        self.assertEqual(fine.discount_percent, 50)
        self.assertLess(fine.amount_due(), fine.base_amount)

    def test_allowed_traversal_does_not_generate_fine(self):
        started_at = timezone.now() - timedelta(minutes=40)
        create_capture(
            toll=self.entry_toll,
            captured_at=started_at,
            plate_text='SK-9999-AA',
            country='MK',
        )
        create_capture(
            toll=self.exit_toll,
            captured_at=started_at + timedelta(minutes=25),
            plate_text='SK-9999-AA',
            country='MK',
        )

        self.assertFalse(Fine.objects.exists())
