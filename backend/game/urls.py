from django.urls import path
from . import views

urlpatterns = [
    path('streak/milestones', views.streak_milestones, name='streak_milestones'),
]
