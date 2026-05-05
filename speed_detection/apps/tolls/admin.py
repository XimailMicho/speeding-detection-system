from django.contrib import admin

from apps.tolls.models import (
    Appeal,
    AuditLog,
    Fine,
    Notification,
    Payment,
    Toll,
    TollCapture,
    TollConnection,
    TollTraversal,
)


@admin.register(Toll)
class TollAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'is_active')
    list_filter = ('is_active',)
    search_fields = ('name', 'code')


@admin.register(TollConnection)
class TollConnectionAdmin(admin.ModelAdmin):
    list_display = ('from_toll', 'to_toll', 'distance_km', 'max_speed_kph', 'allowed_time_minutes')
    list_filter = ('max_speed_kph',)
    search_fields = ('from_toll__name', 'to_toll__name')


@admin.register(TollCapture)
class TollCaptureAdmin(admin.ModelAdmin):
    list_display = ('plate_text', 'toll', 'vehicle', 'captured_at')
    list_filter = ('toll', 'captured_at')
    search_fields = ('plate_text', 'vehicle__license_plate')
    date_hierarchy = 'captured_at'


@admin.register(TollTraversal)
class TollTraversalAdmin(admin.ModelAdmin):
    list_display = (
        'vehicle',
        'connection',
        'observed_duration_seconds',
        'expected_duration_seconds',
        'average_speed_kph',
        'is_speeding',
    )
    list_filter = ('is_speeding', 'connection')
    search_fields = ('vehicle__license_plate',)


@admin.register(Fine)
class FineAdmin(admin.ModelAdmin):
    list_display = ('reference_number', 'vehicle', 'driver', 'base_amount', 'status', 'issued_at', 'discount_deadline')
    list_filter = ('status', 'issued_at')
    search_fields = ('reference_number', 'vehicle__license_plate', 'driver__username', 'driver__email')
    date_hierarchy = 'issued_at'


@admin.register(Appeal)
class AppealAdmin(admin.ModelAdmin):
    list_display = ('fine', 'submitted_by', 'status', 'submitted_at', 'reviewed_by', 'reviewed_at')
    list_filter = ('status', 'submitted_at')
    search_fields = ('fine__reference_number', 'submitted_by__username', 'reason')


@admin.register(Payment)
class PaymentAdmin(admin.ModelAdmin):
    list_display = ('fine', 'amount', 'provider', 'status', 'paid_at', 'created_at')
    list_filter = ('status', 'provider')
    search_fields = ('fine__reference_number', 'provider_reference')


@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ('fine', 'channel', 'recipient', 'status', 'sent_at', 'created_at')
    list_filter = ('channel', 'status')
    search_fields = ('fine__reference_number', 'recipient', 'message')


@admin.register(AuditLog)
class AuditLogAdmin(admin.ModelAdmin):
    list_display = ('action', 'entity_type', 'entity_id', 'actor', 'created_at')
    list_filter = ('action', 'entity_type')
    search_fields = ('action', 'entity_type', 'entity_id', 'actor__username')
