from django.urls import path

from apps.users import api

urlpatterns = [
    path('register/', api.register, name='api-register'),
    path('login/', api.login_view, name='api-login'),
    path('logout/', api.logout_view, name='api-logout'),
    path('me/', api.me, name='api-me'),
]
