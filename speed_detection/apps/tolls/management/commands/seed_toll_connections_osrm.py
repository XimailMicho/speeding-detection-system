from __future__ import annotations

from dataclasses import dataclass
from decimal import Decimal
from time import sleep
from typing import Iterable

import requests
from django.core.management.base import BaseCommand
from django.db import transaction

from apps.tolls.models import Toll, TollConnection


@dataclass(frozen=True)
class TollPair:
    from_name: str
    to_name: str


PAIR_SEEDS = [
    TollPair("Pay toll Gostivar", "Pay toll Tetovo"),
    TollPair("Pay toll Tetovo", "Pay toll Glumovo"),
    TollPair("Pay toll Glumovo", "Pay toll Miladinovci"),
    TollPair("Pay toll Glumovo", "Pay toll Petrovec"),
    TollPair("Pay toll Miladinovci", "Pay toll Romanovce"),
    TollPair("Pay toll Miladinovci", "Pay toll Preod"),
    TollPair("Pay toll Petrovec", "Pay toll Otovica"),
    TollPair("Pay toll Otovica", "Pay toll Gradsko"),
    TollPair("Pay toll Preod", "Pay toll Kadrifakovo"),
]


def expand_pairs(pairs: Iterable[TollPair]) -> list[TollPair]:
    expanded = []
    for pair in pairs:
        expanded.append(pair)
        expanded.append(TollPair(pair.to_name, pair.from_name))
    return expanded


def osrm_route(osrm_base_url: str, from_toll: Toll, to_toll: Toll) -> tuple[float, float]:
    origin = from_toll.coordinates
    destination = to_toll.coordinates
    url = (
        f"{osrm_base_url}/route/v1/driving/"
        f"{origin.longitude},{origin.latitude};"
        f"{destination.longitude},{destination.latitude}"
    )
    response = requests.get(url, params={"overview": "false"}, timeout=20)
    response.raise_for_status()
    payload = response.json()

    if payload.get("code") != "Ok" or not payload.get("routes"):
        raise RuntimeError(f"OSRM error for {from_toll} -> {to_toll}: {payload}")

    route = payload["routes"][0]
    distance_km = route["distance"] / 1000
    duration_seconds = route["duration"]
    return distance_km, duration_seconds


class Command(BaseCommand):
    help = "Seed TollConnections with OSRM distances and allowed time (130 kph)."

    def add_arguments(self, parser):
        parser.add_argument(
            "--osrm-base-url",
            default="https://router.project-osrm.org",
            help="OSRM base URL (default: public demo).",
        )
        parser.add_argument(
            "--speed-kph",
            type=Decimal,
            default=Decimal("130"),
            help="Speed used to compute allowed_time_minutes (default: 130).",
        )
        parser.add_argument(
            "--sleep-seconds",
            type=float,
            default=0.2,
            help="Delay between OSRM requests (default: 0.2).",
        )
        parser.add_argument(
            "--dry-run",
            action="store_true",
            help="Show what would change without writing to the database.",
        )

    @transaction.atomic
    def handle(self, *args, **options):
        osrm_base_url = options["osrm_base_url"].rstrip("/")
        speed_kph = options["speed_kph"]
        sleep_seconds = options["sleep_seconds"]
        dry_run = options["dry_run"]

        created = 0
        updated = 0

        for pair in expand_pairs(PAIR_SEEDS):
            from_toll = Toll.objects.select_related("coordinates").get(name=pair.from_name)
            to_toll = Toll.objects.select_related("coordinates").get(name=pair.to_name)

            distance_km, duration_seconds = osrm_route(osrm_base_url, from_toll, to_toll)
            allowed_minutes = Decimal(str(distance_km)) / speed_kph * Decimal("60")

            if dry_run:
                self.stdout.write(
                    f"DRY_RUN {from_toll} -> {to_toll}: "
                    f"{distance_km:.3f} km, {allowed_minutes:.3f} min"
                )
            else:
                _, was_created = TollConnection.objects.update_or_create(
                    from_toll=from_toll,
                    to_toll=to_toll,
                    defaults={
                        "distance_km": distance_km,
                        "allowed_time_minutes": allowed_minutes,
                        "max_speed_kph": int(speed_kph),
                    },
                )
                if was_created:
                    created += 1
                else:
                    updated += 1

            if sleep_seconds:
                sleep(sleep_seconds)

        if dry_run:
            self.stdout.write(self.style.WARNING("Dry run: no changes written."))
        self.stdout.write(f"Seeded toll connections. Created: {created}, updated: {updated}.")

