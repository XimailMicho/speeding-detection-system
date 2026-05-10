from __future__ import annotations

from datetime import timedelta
from pathlib import Path

from django.conf import settings
from django.contrib.auth import get_user_model
from django.core.management.base import BaseCommand, CommandError
from django.utils import timezone

from apps.tolls.models import Toll, TollTraversal
from apps.tolls.services import create_capture, normalize_plate, read_plate_from_image
from apps.vehicles.models import Vehicle

# Command to demonstrate the traversal from real life without the cameras,
# sending pictures to the OCR and creating the captures, traversal and fine if speeding.
# You can use it with any images, but for best results use clear pictures of license plates.
# You can also provide the plate text directly to bypass OCR if you want to test traversal/fine logic without worrying about OCR accuracy.


class Command(BaseCommand):
    help = "Run a demo OCR flow: two images -> captures -> traversal + fine if speeding."

    def add_arguments(self, parser):
        parser.add_argument('--entry-toll', default='ROM')
        parser.add_argument('--exit-toll', default='PET')
        parser.add_argument('--entry-image', default='services/pictures/7.png')
        parser.add_argument('--exit-image', default='services/pictures/7.png')
        parser.add_argument('--minutes-between', type=int, default=10)
        parser.add_argument('--plate-text', default='')
        parser.add_argument('--vehicle-plate', default='SK-1234-AB')
        parser.add_argument('--driver-email', default='driver@roadeye.local')
        parser.add_argument('--allow-empty', action='store_true')

    def handle(self, *args, **options):
        entry_toll = self._resolve_toll(options['entry_toll'])
        exit_toll = self._resolve_toll(options['exit_toll'])

        entry_image = self._resolve_path(options['entry_image'])
        exit_image = self._resolve_path(options['exit_image'])

        entry_plate, entry_conf, entry_payload = read_plate_from_image(str(entry_image))
        exit_plate, exit_conf, exit_payload = read_plate_from_image(str(exit_image))

        plate_text = normalize_plate(options['plate_text'])
        if not plate_text:
            plate_text = self._pick_plate(entry_plate, exit_plate)

        if not plate_text and options['vehicle_plate']:
            vehicle = Vehicle.objects.filter(license_plate=options['vehicle_plate']).first()
            if vehicle:
                plate_text = vehicle.license_plate

        if not plate_text and not options['allow_empty']:
            raise CommandError(
                "No plate text detected. Provide --plate-text or --allow-empty to continue."
            )

        if plate_text:
            driver = self._resolve_driver(options['driver_email'])
            Vehicle.objects.update_or_create(
                license_plate=plate_text,
                defaults={'owner': driver},
            )

        entry_time = timezone.now() - timedelta(minutes=options['minutes_between'])
        entry_capture = create_capture(
            toll=entry_toll,
            captured_at=entry_time,
            plate_text=plate_text,
            image_path=str(entry_image),
            ocr_confidence=entry_conf,
            raw_ocr_payload=entry_payload,
        )

        exit_capture = create_capture(
            toll=exit_toll,
            captured_at=entry_time + timedelta(minutes=options['minutes_between']),
            plate_text=plate_text,
            image_path=str(exit_image),
            ocr_confidence=exit_conf,
            raw_ocr_payload=exit_payload,
        )

        traversal = TollTraversal.objects.filter(exit_capture=exit_capture).first()

        self.stdout.write(self.style.SUCCESS("Demo OCR flow completed."))
        self.stdout.write(f"Entry: {entry_capture}")
        self.stdout.write(f"Exit:  {exit_capture}")
        self.stdout.write(f"OCR entry: {entry_plate} ({entry_conf})")
        self.stdout.write(f"OCR exit:  {exit_plate} ({exit_conf})")

        if traversal:
            status = "SPEEDING" if traversal.is_speeding else "OK"
            self.stdout.write(
                f"Traversal: {traversal.connection} | {traversal.observed_duration_seconds}s | {status}"
            )
            fine = getattr(traversal, 'fine', None)
            if fine and fine.driver:
                self.stdout.write(
                    f"Driver: {fine.driver.email} ({fine.driver.get_full_name() or fine.driver.username})"
                )
            elif fine:
                self.stdout.write("Driver: not set on fine (vehicle has no owner).")
        else:
            self.stdout.write("Traversal: not created (no matching connection or plate missing).")

    def _resolve_toll(self, value: str) -> Toll:
        if value.isdigit():
            toll = Toll.objects.filter(pk=int(value)).first()
        else:
            toll = Toll.objects.filter(code=value).first()
        if not toll:
            raise CommandError(f"Toll not found for '{value}'.")
        return toll

    def _resolve_driver(self, email: str):
        User = get_user_model()
        driver = User.objects.filter(email=email).first() or User.objects.filter(username=email).first()
        if not driver:
            raise CommandError(f"Driver not found for '{email}'. Run seed_roadeye_demo first.")
        return driver

    def _resolve_path(self, value: str) -> Path:
        path = Path(value)
        if not path.is_absolute():
            path = Path(settings.BASE_DIR) / value
        if not path.exists():
            raise CommandError(f"Image not found: {path}")
        return path

    def _pick_plate(self, entry_plate: str, exit_plate: str) -> str:
        if entry_plate and exit_plate and entry_plate == exit_plate:
            return entry_plate
        if entry_plate:
            return entry_plate
        return exit_plate

