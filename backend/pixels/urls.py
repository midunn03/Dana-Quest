from django.urls import path

from . import views

urlpatterns = [path('places', views.places)]
