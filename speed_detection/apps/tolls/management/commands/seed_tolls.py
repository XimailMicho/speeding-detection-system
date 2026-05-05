from __future__ import annotations

from dataclasses import dataclass

from django.core.management.base import BaseCommand
from django.db import transaction

from apps.tolls.models import Toll
from common.models import Coordinates


@dataclass(frozen=True)
class TollSeed:
    name: str
    code: str
    latitude: float
    longitude: float


TOLL_SEEDS = [
    TollSeed("Pay toll Glumovo", "GLU", 42.00353129987631, 21.288213950133482),
    TollSeed("Pay toll Petrovec", "PET", 41.96065597104091, 21.612310614313166),
    TollSeed("Pay toll Miladinovci", "MIL", 42.006592718586454, 21.641149724261364),
    TollSeed("Pay toll Zelino", "ZEL", 42.00878904368914, 21.072293952499592),
    TollSeed("Pay toll Romanovce", "ROM", 42.13502256583595, 21.692719061549667),
    TollSeed("Pay toll Otovica", "OTO", 41.793968696141675, 21.770996645694762),
    TollSeed("Pay toll Tetovo", "TET", 41.998370457723546, 20.954751234399414),
    TollSeed("Pay toll Gradsko", "GRO", 41.62054829741966, 21.910984234399425),
    TollSeed("Pay toll Preod", "PRD", 41.93903556791141, 21.864292342102353),
    TollSeed("Pay toll Gostivar", "GVR", 41.840962703531495, 20.923773080098886),
    TollSeed("Pay toll Sopot", "SPT", 41.78762074341606, 21.734533088699926),
    TollSeed("Pay toll Kadrifakovo", "KDF", 41.82121835239757, 22.047375108834146),
]


class Command(BaseCommand):
    help = "Seed toll stations with fixed coordinates."

    def add_arguments(self, parser):
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without writing to the database.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        dry_run = options["dry_run"]
        created = 0
        updated = 0

        for seed in TOLL_SEEDS:
            toll = Toll.objects.filter(code=seed.code).select_related("coordinates").first()
            if toll:
                toll.name = seed.name
                toll.is_active = True
                if toll.coordinates:
                    toll.coordinates.latitude = seed.latitude
                    toll.coordinates.longitude = seed.longitude
                    if not dry_run:
                        toll.coordinates.save(update_fields=["latitude", "longitude"])
                else:
                    if not dry_run:
                        toll.coordinates = Coordinates.objects.create(
                            latitude=seed.latitude,
                            longitude=seed.longitude,
                        )
                if not dry_run:
                    toll.save(update_fields=["name", "is_active", "coordinates"])
                updated += 1
                continue

            if dry_run:
                created += 1
                continue

            coordinates = Coordinates.objects.create(
                latitude=seed.latitude,
                longitude=seed.longitude,
            )
            Toll.objects.create(
                name=seed.name,
                code=seed.code,
                is_active=True,
                coordinates=coordinates,
            )
            created += 1

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: no changes written."))
        self.stdout.write(f"Seeded tolls. Created: {created}, updated: {updated}.")

