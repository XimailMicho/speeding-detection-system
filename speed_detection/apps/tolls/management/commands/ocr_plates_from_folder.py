from __future__ import annotations

from datetime import datetime
from pathlib import Path

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.tolls.models import Toll, TollCapture
from apps.vehicles.models import Vehicle
from services.recognition.plate_ocr import PlateOcr


IMAGE_EXTENSIONS = {".jpg", ".jpeg", ".png", ".bmp", ".tiff"}


def iter_images(folder: Path) -> list[Path]:
    return sorted(path for path in folder.iterdir() if path.suffix.lower() in IMAGE_EXTENSIONS)


def file_timestamp(path: Path) -> datetime:
    return datetime.fromtimestamp(path.stat().st_mtime)


class Command(BaseCommand):
    help = "Run license plate OCR for a folder of images and optionally persist results."

    def add_arguments(self, parser) -> None:
        parser.add_argument("--folder", required=True, help="Folder with images to process.")
        parser.add_argument("--toll-id", type=int, required=True, help="Toll ID for captured images.")
        parser.add_argument("--persist", action="store_true", help="Persist TollCapture rows.")
        parser.add_argument(
            "--persist-empty",
            action="store_true",
            help="Persist captures even when plate OCR fails.",
        )
        parser.add_argument("--languages", default="en", help="Comma-separated OCR languages.")
        parser.add_argument("--gpu", action="store_true", help="Enable GPU if available.")
        parser.add_argument("--country", default="", help="Optional country code for new vehicles.")

    def handle(self, *args, **options) -> None:
        folder = Path(options["folder"])
        if not folder.exists():
            raise SystemExit(f"Folder does not exist: {folder}")

        toll = Toll.objects.get(pk=options["toll_id"])
        languages = [item.strip() for item in options["languages"].split(",") if item.strip()]
        ocr = PlateOcr(languages=languages or ["en"], gpu=options["gpu"])

        for image_path in iter_images(folder):
            plate_text, confidence, _candidates = ocr.read_plate(str(image_path))
            plate_text = plate_text[:20] if plate_text else ""
            captured_at = timezone.make_aware(file_timestamp(image_path), timezone.get_current_timezone())

            if plate_text:
                self.stdout.write(f"{image_path.name}: {plate_text} ({confidence})")
            else:
                self.stdout.write(f"{image_path.name}: <no plate>")

            if not options["persist"]:
                continue
            if not plate_text and not options["persist_empty"]:
                continue

            vehicle = None
            if plate_text:
                vehicle, _created = Vehicle.objects.get_or_create(
                    license_plate=plate_text,
                    defaults={"plate_country": options["country"]},
                )

            TollCapture.objects.create(
                toll=toll,
                vehicle=vehicle,
                plate_text=plate_text,
                captured_at=captured_at,
                image_path=str(image_path),
                ocr_confidence=confidence,
            )

