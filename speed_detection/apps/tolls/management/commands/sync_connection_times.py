from __future__ import annotations

from django.core.management.base import BaseCommand
from django.utils import timezone

from apps.tolls.models import TollConnection, TollConnectionDailyTime


class Command(BaseCommand):
    help = "Cache expected daily route times. In production this command can be wired to Google Maps API results."

    def add_arguments(self, parser):
        parser.add_argument('--connection-id', type=int)
        parser.add_argument('--duration-seconds', type=int)
        parser.add_argument('--duration-in-traffic-seconds', type=int)
        parser.add_argument('--distance-meters', type=int)

    def handle(self, *args, **options):
        qs = TollConnection.objects.all()
        if options['connection_id']:
            qs = qs.filter(pk=options['connection_id'])

        for connection in qs:
            duration = options['duration_seconds'] or connection.maps_duration_seconds or connection.minimum_allowed_seconds()
            duration_in_traffic = options['duration_in_traffic_seconds'] or connection.maps_duration_in_traffic_seconds
            distance_meters = options['distance_meters'] or connection.maps_distance_meters or int(connection.distance_km * 1000)
            TollConnectionDailyTime.objects.update_or_create(
                connection=connection,
                date=timezone.localdate(),
                defaults={
                    'expected_duration_seconds': duration,
                    'expected_duration_in_traffic_seconds': duration_in_traffic,
                    'distance_meters': distance_meters,
                    'source': 'manual_or_maps',
                },
            )
            self.stdout.write(f'Synced {connection}: {duration}s')
