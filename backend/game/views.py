"""GET/POST /api/auth/game — đồng bộ tiến độ, xu và ảnh theo tài khoản (thay server/account-data.mjs)."""
import base64
import binascii
import json
import re
import time

from django.db import DatabaseError, transaction
from django.http import JsonResponse
from django.views.decorators.http import require_http_methods

from . import rules
from accounts.ownership import owner_error
from .models import GamePhoto, GameState, GameStateBackup

MAX_PHOTOS = 40
MAX_B64 = 4_194_304
B64_RE = re.compile(r'^[A-Za-z0-9+/]+={0,2}$')


def fail(status, message):
    return JsonResponse({'message': message}, status=status)


def photo_meta(photo):
    return {'id': photo.key, 'destinationId': photo.destination_id, 'missionId': photo.mission_id, 'createdAt': photo.created_ms}


def snapshot(row, user, full=False, include_quarantined=False):
    query = GamePhoto.objects.filter(user=user)
    if not include_quarantined:
        query = query.filter(quarantined=False)
    photos = list(query)
    items = [{**photo_meta(p), 'data': base64.b64encode(bytes(p.data)).decode()} if full else photo_meta(p) for p in photos]
    if include_quarantined:
        items = [{**item, 'quarantined': photo.quarantined} for item, photo in zip(items, photos)]
    return {'revision': row.revision, 'state': row.state or rules.empty_state(), 'photos': items}


def add_photo(user, row, photo):
    if not isinstance(photo, dict):
        raise rules.GameError(400, 'Nhiệm vụ ảnh không hợp lệ hoặc đã hoàn thành.')
    dest, mission = photo.get('destinationId'), photo.get('missionId')
    progress = (row.state.get('destinations') or {}).get(dest) if isinstance(dest, str) else None
    if (mission not in rules.PHOTO_MISSIONS or photo.get('id') != f'{dest}:{mission}' or not progress
            or mission not in progress.get('selected', []) or mission in progress.get('completed', [])):
        raise rules.GameError(400, 'Nhiệm vụ ảnh không hợp lệ hoặc đã hoàn thành.')
    data = photo.get('data')
    if not isinstance(data, str) or not data or len(data) > MAX_B64 or not B64_RE.match(data):
        raise rules.GameError(400, 'Ảnh không hợp lệ hoặc quá lớn.')
    try:
        raw = base64.b64decode(data, validate=True)
    except (binascii.Error, ValueError):
        raise rules.GameError(400, 'Ảnh không hợp lệ hoặc quá lớn.')
    if raw[:3] != b'\xff\xd8\xff':
        raise rules.GameError(400, 'Ảnh phải có định dạng JPEG.')
    key = photo['id']
    others = GamePhoto.objects.filter(user=user, quarantined=False).exclude(key=key).count()
    if others >= MAX_PHOTOS:
        raise rules.GameError(400, f'Album đã đạt giới hạn {MAX_PHOTOS} ảnh.')
    GamePhoto.objects.update_or_create(user=user, key=key, defaults={
        'destination_id': dest, 'mission_id': mission, 'data': raw, 'created_ms': int(time.time() * 1000), 'quarantined': False})


@require_http_methods(['GET', 'POST'])
def game(request):
    user = request.user
    if not user.is_authenticated:
        return fail(401, 'Phiên đã hết hạn. Hãy đăng nhập lại.')
    denied = owner_error(request)
    if denied:
        return denied

    if request.method == 'GET':
        row = GameState.objects.filter(user=user).first() or GameState(user=user, state=rules.empty_state())
        full = snapshot(row, user, full=True)
        if not rules.is_healthy(row.state, full['photos']):
            return fail(422, 'Tiến độ không hợp lệ. Hãy khôi phục dữ liệu trước khi tiếp tục.')
        if request.GET.get('photos') != 'full':
            full['photos'] = [{key: value for key, value in item.items() if key != 'data'} for item in full['photos']]
        return JsonResponse(full)

    try:
        data = json.loads(request.body or b'{}')
    except ValueError:
        return fail(400, 'Dữ liệu không hợp lệ.')
    if not isinstance(data, dict):
        return fail(400, 'Dữ liệu không hợp lệ.')

    try:
        with transaction.atomic():
            row, _ = GameState.objects.select_for_update().get_or_create(user=user, defaults={'state': rules.empty_state()})
            saved_photos = snapshot(row, user, full=True)['photos']
            kind = data.get('kind')
            if kind == 'reset':
                if rules.is_healthy(row.state, saved_photos):
                    raise rules.GameError(400, 'Dữ liệu không bị hỏng, không cần đặt lại.')
                try:
                    GameStateBackup.objects.create(user=user, revision=row.revision, state=row.state, photos=snapshot(row, user, full=True, include_quarantined=True)['photos'])
                except DatabaseError as error:
                    raise rules.GameError(503, 'Không thể sao lưu tiến độ. Dữ liệu chưa được đặt lại.') from error
                # Photo-only corruption must not erase otherwise valid progress/times.
                if not rules.is_healthy(row.state):
                    row.state = rules.empty_state()
                retained = 0
                for photo in GamePhoto.objects.filter(user=user, quarantined=False).order_by('pk'):
                    saved = {**photo_meta(photo), 'data': base64.b64encode(bytes(photo.data)).decode()}
                    if retained < MAX_PHOTOS and rules.is_healthy(rules.empty_state(), [saved]):
                        retained += 1
                    else:
                        photo.quarantined = True
                        photo.save(update_fields=['quarantined'])
                row.save()
                return JsonResponse({'revision': row.revision, 'state': row.state})
            if not rules.is_healthy(row.state, saved_photos):
                raise rules.GameError(422, 'Tiến độ không hợp lệ. Hãy khôi phục dữ liệu trước khi tiếp tục.')
            if data.get('revision') != row.revision:
                raise rules.GameError(409, 'Dữ liệu đã thay đổi trên thiết bị khác. Đang tải lại.')
            if kind == 'action':
                keys = set(GamePhoto.objects.filter(user=user, quarantined=False).values_list('key', flat=True))
                row.state = rules.apply_action(row.state, data.get('action'), keys)
            elif kind == 'photo':
                add_photo(user, row, data.get('photo'))
            elif kind == 'delete-photo':
                GamePhoto.objects.filter(user=user, key=data.get('photoId')).delete()
            else:
                raise rules.GameError(400, 'Thao tác không hợp lệ.')
            row.revision += 1
            row.save()
    except rules.GameError as error:
        return fail(error.status, error.message)
    return JsonResponse({'revision': row.revision, 'state': row.state})


@require_http_methods(['GET'])
def streak_milestones(request):
    """GET /api/game/streak/milestones — tra ve danh sach cac moc thuong streak dang kich hoat."""
    from .models import StreakMilestone
    milestones = [
        {
            'days': m.days,
            'bonusCoins': m.bonus_coins,
            'bonusXp': m.bonus_xp,
            'message': m.message,
        }
        for m in StreakMilestone.objects.filter(is_active=True).order_by('days')
    ]
    return JsonResponse({'milestones': milestones})


@require_http_methods(['GET'])
def badge_catalog(request):
    """GET /api/game/badges — danh sach chu de va huy hieu."""
    from .models import BadgeTheme
    themes = []
    for t in BadgeTheme.objects.all().prefetch_related('badges').order_by('order', 'id'):
        themes.append({
            'slug': t.slug,
            'name': t.name,
            'description': t.description,
            'icon': t.icon,
            'completionBonusCoins': t.completion_bonus_coins,
            'completionBonusXp': t.completion_bonus_xp,
            'badges': [
                {
                    'id': b.badge_id,
                    'title': b.title,
                    'description': b.description,
                    'rarity': b.rarity,
                    'icon': b.icon_placeholder,
                    'image': b.image.url if b.image else None,
                    'requiredDestinations': b.required_destinations,
                    'requiredCount': b.required_count,
                    'bonusCoins': b.bonus_coins,
                    'bonusXp': b.bonus_xp,
                }
                for b in t.badges.filter(is_active=True).order_by('order', 'id')
            ]
        })
    return JsonResponse({'themes': themes})


@require_http_methods(['GET'])
def golden_hour_challenges(request):
    """GET /api/game/golden-hours — danh sach thu thach gio vang."""
    from .models import GoldenHourChallenge
    items = [
        {
            'id': g.id,
            'destinationId': g.destination_id,
            'title': g.title,
            'description': g.description,
            'daysOfWeek': g.days_of_week,
            'startTime': g.start_time.strftime('%H:%M'),
            'endTime': g.end_time.strftime('%H:%M'),
            'bonusCoins': g.bonus_coins,
            'multiplier': g.multiplier,
            'latitude': g.latitude,
            'longitude': g.longitude,
            'radiusMeters': g.radius_meters,
        }
        for g in GoldenHourChallenge.objects.filter(is_active=True).order_by('destination_id', 'start_time')
    ]
    return JsonResponse({'challenges': items})


@require_http_methods(['GET'])
def partner_vouchers_list(request):
    """GET /api/game/vouchers — danh sach voucher doi tac co the doi bang xu."""
    from .models import PartnerVoucher
    import datetime
    today = datetime.date.today()
    vouchers = [
        {
            'id': v.id,
            'codePrefix': v.code_prefix,
            'partnerName': v.partner_name,
            'destinationId': v.destination_id,
            'title': v.title,
            'description': v.description,
            'coinCost': v.coin_cost,
            'remaining': v.remaining_quantity,
            'expiresAt': v.expires_at.isoformat(),
            'isSample': v.is_sample,
        }
        for v in PartnerVoucher.objects.filter(is_active=True, expires_at__gte=today, remaining_quantity__gt=0).order_by('-id')
    ]
    return JsonResponse({'vouchers': vouchers})


@require_http_methods(['POST'])
def redeem_partner_voucher(request):
    """POST /api/game/vouchers/redeem — doi xu lay ma voucher dung mot lan."""
    from .models import PartnerVoucher, UserVoucherRedemption
    import uuid, time, datetime

    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'message': 'Vui long dang nhap de doi voucher.'}, status=401)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Du lieu khong hop le.'}, status=400)

    voucher_id = data.get('voucherId')
    voucher = PartnerVoucher.objects.filter(id=voucher_id, is_active=True).first()
    if not voucher:
        return JsonResponse({'message': 'Khong tim thay voucher hoac voucher da het han.'}, status=404)

    if voucher.remaining_quantity <= 0 or voucher.expires_at < datetime.date.today():
        return JsonResponse({'message': 'Voucher nay da het luot doi.'}, status=400)

    # Sinh ma duy nhat dung mot lan
    random_part = uuid.uuid4().hex[:8].upper()
    single_use_code = f'{voucher.code_prefix}-{random_part[:4]}-{random_part[4:]}'

    with transaction.atomic():
        voucher.remaining_quantity -= 1
        voucher.save(update_fields=['remaining_quantity'])

        redemption = UserVoucherRedemption.objects.create(
            user=request.user,
            voucher=voucher,
            redemption_code=single_use_code,
            coin_spent=voucher.coin_cost,
            redeemed_at_ms=int(time.time() * 1000),
        )

    return JsonResponse({
        'success': True,
        'redemptionCode': redemption.redemption_code,
        'partnerName': voucher.partner_name,
        'title': voucher.title,
        'coinSpent': voucher.coin_cost,
        'expiresAt': voucher.expires_at.isoformat(),
        'message': f'Doi thanh cong! Ma voucher cua ban la: {single_use_code}',
    })


@require_http_methods(['GET'])
def my_partner_vouchers(request):
    """GET /api/game/vouchers/my — danh sach voucher ma nguoi choi da doi."""
    from .models import UserVoucherRedemption
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'message': 'Vui long dang nhap.'}, status=401)

    items = [
        {
            'id': r.id,
            'redemptionCode': r.redemption_code,
            'partnerName': r.voucher.partner_name,
            'title': r.voucher.title,
            'description': r.voucher.description,
            'coinSpent': r.coin_spent,
            'redeemedAt': r.redeemed_at_ms,
            'expiresAt': r.voucher.expires_at.isoformat(),
            'isUsed': r.is_used,
            'isSample': r.voucher.is_sample,
        }
        for r in UserVoucherRedemption.objects.filter(user=request.user).select_related('voucher').order_by('-redeemed_at_ms')
    ]
    return JsonResponse({'vouchers': items})


@require_http_methods(['GET'])
def my_groups(request):
    """GET /api/game/groups/my — danh sach nhom va bang xep hang thanh vien trong nhom."""
    from .models import GroupMembership
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'message': 'Vui long dang nhap.'}, status=401)

    memberships = GroupMembership.objects.filter(user=request.user).select_related('group', 'group__leader')
    groups_data = []

    for m in memberships:
        grp = m.group
        # Get members who opted in
        all_members = GroupMembership.objects.filter(group=grp).select_related('user', 'user__profile')
        leaderboard = []
        for mem in all_members:
            if not mem.opt_in_leaderboard:
                continue
            u = mem.user
            disp_name = getattr(u, 'profile', None) and u.profile.display_name or u.username
            avatar_id = getattr(u, 'profile', None) and u.profile.avatar_id or ''
            # Tinh diem XP / xu cua thanh vien tu GameState neu co
            gs = getattr(u, 'game_state', None)
            missions_count = sum(len(p.get('completed', [])) for p in (gs and gs.state or {}).get('destinations', {}).values()) if gs else 0
            score = missions_count * 10
            leaderboard.append({
                'userId': u.id,
                'displayName': disp_name,
                'avatarId': avatar_id,
                'score': score,
                'isLeader': u.id == grp.leader_id,
                'isSelf': u.id == request.user.id,
            })

        leaderboard.sort(key=lambda x: x['score'], reverse=True)
        for idx, item in enumerate(leaderboard):
            item['rank'] = idx + 1

        groups_data.append({
            'id': grp.id,
            'name': grp.name,
            'code': grp.code,
            'isLeader': grp.leader_id == request.user.id,
            'optIn': m.opt_in_leaderboard,
            'memberCount': all_members.count(),
            'leaderboard': leaderboard,
        })

    return JsonResponse({'groups': groups_data})


@require_http_methods(['POST'])
def create_group(request):
    """POST /api/game/groups/create — tao nhom ban be moi."""
    from .models import PlayerGroup, GroupMembership
    import uuid

    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'message': 'Vui long dang nhap de tao nhom.'}, status=401)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Du lieu khong hop le.'}, status=400)

    name = (data.get('name') or '').strip()
    if not name or len(name) < 2 or len(name) > 80:
        return JsonResponse({'message': 'Ten nhom phai tu 2 den 80 ky tu.'}, status=400)

    code = f'DANA-{uuid.uuid4().hex[:6].upper()}'

    with transaction.atomic():
        group = PlayerGroup.objects.create(name=name, code=code, leader=request.user)
        GroupMembership.objects.create(group=group, user=request.user, opt_in_leaderboard=True)

    return JsonResponse({'success': True, 'groupId': group.id, 'name': group.name, 'code': group.code})


@require_http_methods(['POST'])
def join_group(request):
    """POST /api/game/groups/join — tham gia nhom bang ma moi."""
    from .models import PlayerGroup, GroupMembership

    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'message': 'Vui long dang nhap de tham gia nhom.'}, status=401)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Du lieu khong hop le.'}, status=400)

    code = (data.get('code') or '').strip().upper()
    group = PlayerGroup.objects.filter(code=code).first()
    if not group:
        return JsonResponse({'message': 'Ma nhom khong ton tai.'}, status=404)

    if GroupMembership.objects.filter(group=group, user=request.user).exists():
        return JsonResponse({'message': 'Ban da o trong nhom nay roi.'}, status=409)

    GroupMembership.objects.create(group=group, user=request.user, opt_in_leaderboard=True)
    return JsonResponse({'success': True, 'groupId': group.id, 'name': group.name})


@require_http_methods(['POST'])
def leave_group(request):
    """POST /api/game/groups/leave — roi khoi nhom."""
    from .models import GroupMembership
    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'message': 'Vui long dang nhap.'}, status=401)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Du lieu khong hop le.'}, status=400)

    group_id = data.get('groupId')
    mem = GroupMembership.objects.filter(group_id=group_id, user=request.user).first()
    if not mem:
        return JsonResponse({'message': 'Ban khong thuoc nhom nay.'}, status=404)

    mem.delete()
    return JsonResponse({'success': True, 'message': 'Da roi nhom.'})


@require_http_methods(['POST'])
def cocheckin(request):
    """POST /api/game/cocheckin — thuong di cung nhau neu 2+ thanh vien check-in gan thoi gian."""
    from .models import GroupMembership, CoCheckinRecord
    import datetime

    if not request.user or not request.user.is_authenticated:
        return JsonResponse({'message': 'Vui long dang nhap.'}, status=401)

    try:
        data = json.loads(request.body.decode('utf-8'))
    except Exception:
        return JsonResponse({'message': 'Du lieu khong hop le.'}, status=400)

    dest_id = data.get('destinationId')
    if not dest_id:
        return JsonResponse({'message': 'Thieu destinationId.'}, status=400)

    today_str = datetime.date.today().isoformat()
    # Tim cac nhom ma user tham gia
    user_groups = GroupMembership.objects.filter(user=request.user).values_list('group_id', flat=True)
    bonus_awarded = False
    coins = 0

    for g_id in user_groups:
        # Tim xem co thanh vien khac cua nhom da checkin diem nay hom nay chua
        existing = CoCheckinRecord.objects.filter(group_id=g_id, destination_id=dest_id, date_key=today_str).first()
        if existing:
            if not existing.members.filter(id=request.user.id).exists():
                existing.members.add(request.user)
                bonus_awarded = True
                coins = existing.bonus_coins
        else:
            rec = CoCheckinRecord.objects.create(group_id=g_id, destination_id=dest_id, date_key=today_str, bonus_coins=10)
            rec.members.add(request.user)

    return JsonResponse({
        'success': True,
        'cocheckinBonus': bonus_awarded,
        'bonusCoins': coins if bonus_awarded else 0,
        'message': f'Thanh cong! Thuong "Di cung nhau" +{coins} xu!' if bonus_awarded else 'Check-in ghi nhan thanh cong.'
    })
