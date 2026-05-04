# Generated for RoadEye backend completion.

import django.core.validators
import django.db.models.deletion
import django.utils.timezone
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
        ('vehicles', '0002_vehicle_owner_details'),
        ('tolls', '0001_initial'),
    ]

    operations = [
        migrations.AddField(
            model_name='toll',
            name='city',
            field=models.CharField(blank=True, max_length=80),
        ),
        migrations.AddField(
            model_name='toll',
            name='code',
            field=models.CharField(blank=True, max_length=20, null=True, unique=True),
        ),
        migrations.AddField(
            model_name='toll',
            name='is_active',
            field=models.BooleanField(default=True),
        ),
        migrations.AddField(
            model_name='toll',
            name='road_name',
            field=models.CharField(blank=True, max_length=100),
        ),
        migrations.AddField(
            model_name='tollcapture',
            name='raw_ocr_payload',
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name='tollconnection',
            name='tolerance_kph',
            field=models.PositiveSmallIntegerField(default=5),
        ),
        migrations.AlterField(
            model_name='tollconnection',
            name='max_speed_kph',
            field=models.PositiveSmallIntegerField(blank=True, null=True, validators=[django.core.validators.MinValueValidator(30), django.core.validators.MaxValueValidator(160)]),
        ),
        migrations.AddField(
            model_name='tolltraversal',
            name='speed_limit_kph',
            field=models.PositiveSmallIntegerField(blank=True, null=True),
        ),
        migrations.AddField(
            model_name='tolltraversal',
            name='speed_over_limit_kph',
            field=models.FloatField(default=0),
        ),
        migrations.CreateModel(
            name='AuditLog',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('action', models.CharField(max_length=80)),
                ('entity_type', models.CharField(max_length=80)),
                ('entity_id', models.CharField(blank=True, max_length=80)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('actor', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='roadeye_audit_logs', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Fine',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reference_number', models.CharField(max_length=30, unique=True)),
                ('base_amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('discount_percent', models.PositiveSmallIntegerField(default=50)),
                ('discount_deadline', models.DateTimeField()),
                ('issued_at', models.DateTimeField(default=django.utils.timezone.now)),
                ('due_at', models.DateTimeField()),
                ('status', models.CharField(choices=[('unpaid', 'Unpaid'), ('paid', 'Paid'), ('appealed', 'Appealed'), ('cancelled', 'Cancelled')], default='unpaid', max_length=20)),
                ('notes', models.TextField(blank=True)),
                ('driver', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='fines', to=settings.AUTH_USER_MODEL)),
                ('traversal', models.OneToOneField(on_delete=django.db.models.deletion.PROTECT, related_name='fine', to='tolls.tolltraversal')),
                ('vehicle', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='fines', to='vehicles.vehicle')),
            ],
        ),
        migrations.CreateModel(
            name='Appeal',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('reason', models.TextField()),
                ('evidence_url', models.URLField(blank=True)),
                ('status', models.CharField(choices=[('submitted', 'Submitted'), ('in_review', 'In review'), ('approved', 'Approved'), ('rejected', 'Rejected')], default='submitted', max_length=20)),
                ('admin_response', models.TextField(blank=True)),
                ('submitted_at', models.DateTimeField(auto_now_add=True)),
                ('reviewed_at', models.DateTimeField(blank=True, null=True)),
                ('fine', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='appeals', to='tolls.fine')),
                ('reviewed_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='reviewed_appeals', to=settings.AUTH_USER_MODEL)),
                ('submitted_by', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='appeals', to=settings.AUTH_USER_MODEL)),
            ],
        ),
        migrations.CreateModel(
            name='Notification',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('recipient', models.CharField(max_length=255)),
                ('channel', models.CharField(choices=[('email', 'Email'), ('sms', 'SMS')], max_length=20)),
                ('subject', models.CharField(blank=True, max_length=255)),
                ('message', models.TextField()),
                ('status', models.CharField(choices=[('queued', 'Queued'), ('sent', 'Sent'), ('failed', 'Failed')], default='queued', max_length=20)),
                ('sent_at', models.DateTimeField(blank=True, null=True)),
                ('error_message', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('fine', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='notifications', to='tolls.fine')),
            ],
        ),
        migrations.CreateModel(
            name='Payment',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('amount', models.DecimalField(decimal_places=2, max_digits=10)),
                ('provider', models.CharField(default='demo_gateway', max_length=40)),
                ('provider_reference', models.CharField(blank=True, max_length=80)),
                ('status', models.CharField(choices=[('pending', 'Pending'), ('succeeded', 'Succeeded'), ('failed', 'Failed')], default='pending', max_length=20)),
                ('paid_at', models.DateTimeField(blank=True, null=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('metadata', models.JSONField(blank=True, default=dict)),
                ('fine', models.ForeignKey(on_delete=django.db.models.deletion.PROTECT, related_name='payments', to='tolls.fine')),
            ],
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['entity_type', 'entity_id'], name='tolls_audit_entity__74bc25_idx'),
        ),
        migrations.AddIndex(
            model_name='auditlog',
            index=models.Index(fields=['action', 'created_at'], name='tolls_audit_action_66d27f_idx'),
        ),
        migrations.AddIndex(
            model_name='fine',
            index=models.Index(fields=['status', 'issued_at'], name='tolls_fine_status_8d24f1_idx'),
        ),
        migrations.AddIndex(
            model_name='fine',
            index=models.Index(fields=['reference_number'], name='tolls_fine_referen_8af083_idx'),
        ),
    ]
