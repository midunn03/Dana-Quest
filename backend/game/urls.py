from django.urls import path
from . import views

urlpatterns = [
    path('streak/milestones', views.streak_milestones, name='streak_milestones'),
    path('badges', views.badge_catalog, name='badge_catalog'),
    path('golden-hours', views.golden_hour_challenges, name='golden_hour_challenges'),
    path('vouchers', views.partner_vouchers_list, name='partner_vouchers_list'),
    path('vouchers/redeem', views.redeem_partner_voucher, name='redeem_partner_voucher'),
    path('vouchers/my', views.my_partner_vouchers, name='my_partner_vouchers'),
    path('groups/my', views.my_groups, name='my_groups'),
    path('groups/create', views.create_group, name='create_group'),
    path('groups/join', views.join_group, name='join_group'),
    path('groups/leave', views.leave_group, name='leave_group'),
    path('cocheckin', views.cocheckin, name='cocheckin'),
]
