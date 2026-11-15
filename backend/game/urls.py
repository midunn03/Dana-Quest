from django.urls import path
from . import views

urlpatterns = [
    path('streak/milestones', views.streak_milestones, name='streak_milestones'),
    path('badges', views.badge_catalog, name='badge_catalog'),
    path('golden-hours', views.golden_hour_challenges, name='golden_hour_challenges'),
    path('vouchers', views.partner_vouchers_list, name='partner_vouchers_list'),
    path('vouchers/redeem', views.redeem_partner_voucher, name='redeem_partner_voucher'),
    path('vouchers/my', views.my_partner_vouchers, name='my_partner_vouchers'),
]
