from django.urls import path

from . import views

# Đường dẫn đầy đủ sẽ là /api/auth/<tên> (xem config/urls.py).
urlpatterns = [
    path('session', views.session),
    path('register', views.register),
    path('login', views.login_view),
    path('logout', views.logout_view),
    path('profile', views.profile),
    path('profile/avatar', views.avatar),
]