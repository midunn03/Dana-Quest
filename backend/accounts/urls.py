from django.urls import path

from game import views as game_views
from game import quest_views

from . import views

# Đường dẫn đầy đủ sẽ là /api/auth/<tên> (xem config/urls.py).
urlpatterns = [
    path('session', views.session),
    path('register', views.register),
    path('login', views.login_view),
    path('logout', views.logout_view),
    path('profile', views.profile),
    path('profile/avatar', views.avatar),
    path('game', game_views.game),
    path('quest-runs', quest_views.quest_runs),
    path('quest-codes', quest_views.quest_codes),
    path('quest-codes/redeem', quest_views.redeem_code),
]
