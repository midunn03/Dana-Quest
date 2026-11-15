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
