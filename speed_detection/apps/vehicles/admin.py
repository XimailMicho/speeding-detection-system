from django.contrib import admin

from apps.vehicles.models import Vehicle


@admin.register(Vehicle)
class VehicleAdmin(admin.ModelAdmin):
    list_display = ('license_plate', 'plate_country', 'owner', 'make', 'model', 'is_active')
    list_filter = ('plate_country', 'is_active')
    search_fields = ('license_plate', 'owner__username', 'owner__email', 'make', 'model')
