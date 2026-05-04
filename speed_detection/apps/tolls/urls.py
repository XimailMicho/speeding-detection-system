from django.urls import path

from apps.tolls import api

urlpatterns = [
    path('tolls/', api.tolls, name='api-tolls'),
    path('connections/', api.connections, name='api-toll-connections'),
    path('vehicles/', api.vehicles, name='api-vehicles'),
    path('captures/', api.captures, name='api-captures'),
    path('traversals/', api.traversals, name='api-traversals'),
    path('fines/', api.fines, name='api-fines'),
    path('fines/<int:fine_id>/', api.fine_detail, name='api-fine-detail'),
    path('fines/<int:fine_id>/pay/', api.fine_payment, name='api-fine-payment'),
    path('appeals/', api.appeals, name='api-appeals'),
    path('appeals/<int:appeal_id>/review/', api.appeal_review, name='api-appeal-review'),
    path('statistics/', api.statistics, name='api-statistics'),
]
