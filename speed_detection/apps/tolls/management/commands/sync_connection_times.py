from __future__ import annotations

from math import ceil

from django.core.management.base import BaseCommand

from apps.tolls.models import TollConnection


class Command(BaseCommand):
    help = "Update expected route time stored on TollConnection (allowed_time_minutes)."

    def add_arguments(self, parser):
        parser.add_argument('--connection-id', type=int)
        parser.add_argument('--duration-seconds', type=int)
        parser.add_argument('--distance-meters', type=int)

    def handle(self, *args, **options):
        qs = TollConnection.objects.all()
        if options['connection_id']:
            qs = qs.filter(pk=options['connection_id'])

        for connection in qs:
            duration_seconds = options['duration_seconds'] or connection.minimum_allowed_seconds()
            allowed_minutes = max(1, int(ceil(duration_seconds / 60)))
            connection.allowed_time_minutes = allowed_minutes

            if options['distance_meters']:
                connection.distance_km = options['distance_meters'] / 1000

            connection.save(update_fields=['allowed_time_minutes', 'distance_km'])
            self.stdout.write(f"Synced {connection}: {allowed_minutes} min")
