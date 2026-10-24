"""Luật chơi phía máy chủ (bản Python của server/game-logic.mjs).

Máy chủ là nơi quyết định: giao diện chỉ gửi "hành động", máy chủ tự kiểm tra
(nhiệm vụ có tồn tại và đã được giao, vị trí GPS hợp lệ, đã có ảnh, không hoàn thành
hai lần...) rồi mới lưu. Danh sách nhiệm vụ và phần thưởng phải khớp với
src/data/missions.ts và src/data/rewards.ts.
"""
import json
import math
import random
import time
from pathlib import Path

from django.conf import settings


class GameError(Exception):
    def __init__(self, status, message):
        super().__init__(message)
        self.status = status
        self.message = message


MISSION_KINDS = {
    'arrival': 'arrival', 'overview-photo': 'photo', 'detail-photo': 'photo',
    'read': 'self', 'observe': 'self', 'learn': 'self', 'walk': 'self',
    'respect': 'self', 'green': 'self', 'remember': 'self',
}
PHOTO_MISSIONS = ('overview-photo', 'detail-photo')
REWARD_COSTS = {
    'postcard': 30, 'drink': 50, 'souvenir': 80, 'local-food': 70,
    'transport': 100, 'admission': 150, 'outdoor-activity': 140,
}
COINS_PER_MISSION = 10
ARRIVAL_RADIUS = 100        # mét
MAX_ACCURACY = 50           # mét
MAX_LOCATION_AGE_MS = 60_000


def _load_positions():
    path = Path(getattr(settings, 'DESTINATIONS_JSON', Path(settings.BASE_DIR).parent / 'src' / 'data' / 'destinations.json'))
    with open(path, encoding='utf-8') as handle:
        return {place['id']: place['position'] for place in json.load(handle)}


_builtin = None


def positions():
    """Vị trí của mọi địa điểm hợp lệ: danh sách mẫu trong code, cộng địa điểm do admin thêm (admin ghi đè nếu trùng mã)."""
    global _builtin
    if _builtin is None:
        _builtin = _load_positions()
    result = dict(_builtin)
    try:
        from pixels.models import Place
        for place in Place.objects.all():
            position = place.position()
            if position:
                result[place.slug] = list(position)
    except Exception:  # chưa migrate hoặc chưa có bảng: dùng danh sách mẫu
        pass
    return result


def distance_meters(a, b):
    rad = math.radians
    d_lat, d_lon = rad(b[0] - a[0]), rad(b[1] - a[1])
    h = math.sin(d_lat / 2) ** 2 + math.cos(rad(a[0])) * math.cos(rad(b[0])) * math.sin(d_lon / 2) ** 2
    return 6_371_000 * 2 * math.atan2(math.sqrt(min(1, h)), math.sqrt(max(0, 1 - h)))


def _number(value):
    return isinstance(value, (int, float)) and not isinstance(value, bool) and math.isfinite(value)


def arrival_ok(sample, position, now_ms=None):
    if not isinstance(sample, dict) or not position:
        return False
    lat, lon, acc, ts = (sample.get(k) for k in ('latitude', 'longitude', 'accuracy', 'timestamp'))
    if not all(_number(v) for v in (lat, lon, acc, ts)):
        return False
    if abs(lat) > 90 or abs(lon) > 180 or acc <= 0:
        return False
    now = time.time() * 1000 if now_ms is None else now_ms
    if now < ts or now - ts > MAX_LOCATION_AGE_MS or acc > MAX_ACCURACY:
        return False
    return distance_meters([lat, lon], position) + acc <= ARRIVAL_RADIUS


def empty_state():
    return {'version': 1, 'destinations': {}, 'redemptions': []}


def is_healthy(state):
    return (isinstance(state, dict) and state.get('version') == 1
            and isinstance(state.get('destinations'), dict) and isinstance(state.get('redemptions'), list))


def earned_coins(state):
    return sum(len(p.get('completed', [])) * COINS_PER_MISSION for p in state['destinations'].values())


def coin_balance(state):
    spent = sum(REWARD_COSTS.get(item.get('rewardId'), 0) for item in state['redemptions'])
    return earned_coins(state) - spent


def apply_action(state, action, photo_keys=(), now_ms=None, rng=random):
    """Áp dụng một hành động và trả về trạng thái mới; sai điều kiện thì ném GameError(400)."""
    if not isinstance(action, dict) or action.get('type') not in ('assign', 'complete', 'redeem', 'cancel'):
        raise GameError(400, 'Thao tác không hợp lệ.')
    if not is_healthy(state):
        raise GameError(400, 'Tiến độ không hợp lệ.')
    now = int(time.time() * 1000) if now_ms is None else int(now_ms)
    kind = action['type']

    if kind == 'redeem':
        reward = action.get('rewardId')
        if not isinstance(reward, str) or reward not in REWARD_COSTS:
            raise GameError(400, 'Không tìm thấy voucher mẫu.')
        if any(item.get('rewardId') == reward for item in state['redemptions']):
            raise GameError(400, 'Voucher này đã đổi. Mỗi mẫu chỉ đổi một lần.')
        if coin_balance(state) < REWARD_COSTS[reward]:
            raise GameError(400, 'Chưa đủ Green Coins demo để đổi voucher này.')
        return {**state, 'redemptions': [*state['redemptions'], {'rewardId': reward, 'redeemedAt': now}]}

    dest = action.get('destinationId')
    if not isinstance(dest, str) or dest not in positions():
        raise GameError(400, 'Không tìm thấy địa điểm.')
    progress = state['destinations'].get(dest) or {'selected': [], 'completed': [], 'started': False}

    if kind == 'cancel':
        if not progress['started']:
            return state
        if progress['completed']:
            raise GameError(400, 'Không thể hủy hành trình đã có nhiệm vụ hoàn thành vì sẽ ảnh hưởng số xu đã nhận.')
        return {**state, 'destinations': {k: v for k, v in state['destinations'].items() if k != dest}}

    if kind == 'assign':
        if progress['started']:
            return state
        count = action.get('count')
        if not isinstance(count, int) or isinstance(count, bool) or not 5 <= count <= 10:
            raise GameError(400, 'Hãy chọn số lượng từ 5 đến 10 nhiệm vụ.')
        selected = rng.sample(list(MISSION_KINDS), count)
        entry = {'selected': selected, 'completed': [], 'started': True, 'startedAt': now, 'completedAt': {}}
        return {**state, 'destinations': {**state['destinations'], dest: entry}}

    mission = action.get('missionId')
    if not isinstance(mission, str) or mission not in MISSION_KINDS:
        raise GameError(400, 'Nhiệm vụ không tồn tại.')
    if not progress['started'] or mission not in progress['selected']:
        raise GameError(400, 'Nhiệm vụ chưa được chọn hoặc chưa bắt đầu.')
    if mission in progress['completed']:
        return state
    mkind = MISSION_KINDS[mission]
    if mkind == 'arrival' and not arrival_ok(action.get('location'), positions()[dest], now):
        raise GameError(400, 'Vị trí chưa đạt điều kiện hoặc đã hết hạn. Hãy kiểm tra lại.')
    if mkind == 'photo' and f'{dest}:{mission}' not in photo_keys:
        raise GameError(400, 'Hãy lưu ảnh cho nhiệm vụ trước khi tự xác nhận hoàn thành.')
    entry = {**progress, 'completed': [*progress['completed'], mission],
             'completedAt': {**progress.get('completedAt', {}), mission: now}}
    return {**state, 'destinations': {**state['destinations'], dest: entry}}
