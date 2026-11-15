from django.urls import path
from . import views

urlpatterns = [
    path('streak/milestones', views.streak_milestones, name='streak_milestones'),
    path('badges', views.badge_catalog, name='badge_catalog'),
    path('golden-hours', views.golden_hour_challenges, name='golden_hour_challenges'),
]
