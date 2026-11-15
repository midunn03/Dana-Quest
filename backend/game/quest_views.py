"""Private Node-compatible quest APIs; existing Django admin stays independent."""
import hashlib
import json
import re
import time

from django.contrib.auth import get_user_model
from django.db import OperationalError, transaction
from django.http import JsonResponse

from accounts.ownership import owner_error
from .models import QuestActivationCode, QuestCodeAttempts, QuestRunState
from .quest_rules import fresh, read_runs, update_run
from .rules import GameError

OWNER_CHANGED = 'Tài khoản đã thay đổi. Hãy tải lại trang.'


def denied(request, anonymous):
    if not request.user.is_authenticated:
        return JsonResponse({'message': anonymous}, status=401)
    if owner_error(request) is not None:
        return JsonResponse({'message': OWNER_CHANGED}, status=409)
    return None


def read_json(request):
    try:
        return json.loads(request.body or b'{}')
    except ValueError as error:
        raise GameError(400, 'Dữ liệu không hợp lệ.') from error


def error_response(error):
    return JsonResponse({'message': error.message}, status=error.status)


def quest_runs(request):
    error = denied(request, 'Hãy đăng nhập để lưu tiến độ quest.')
    if error is not None:
        return error
    try:
        if request.method == 'GET':
            row = QuestRunState.objects.filter(user=request.user).first()
            return JsonResponse(read_runs(row.state) if row else fresh())
        if request.method != 'POST':
            return JsonResponse({'message': 'Không tìm thấy chức năng.'}, status=404)
        action = read_json(request)
        with transaction.atomic():
            # Lock a stable parent even before its one-to-one state exists.
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            row, _ = QuestRunState.objects.get_or_create(user=request.user, defaults={'state': fresh()})
            row.state = update_run(row.state, action)
            row.save()
        return JsonResponse(row.state)
    except GameError as error:
        return error_response(error)
    except OperationalError:
        return JsonResponse({'message': 'Kho tiến độ đang bận. Vui lòng thử lại.'}, status=503)


def quest_codes(request):
    error = denied(request, 'Hãy đăng nhập để xem quest đã kích hoạt.')
    if error is not None:
        return error
    if request.method != 'GET':
        return JsonResponse({'message': 'Không tìm thấy chức năng.'}, status=404)
    try:
        items = [{'questId': row.quest_id, 'redeemedAt': row.redeemed_at} for row in QuestActivationCode.objects.filter(user=request.user).order_by('pk')]
    except OperationalError:
        return JsonResponse({'message': 'Kho mã đang bận. Vui lòng thử lại.'}, status=503)
    return JsonResponse({'items': items})


def redeem_code(request):
    error = denied(request, 'Hãy đăng nhập trước khi kích hoạt mã.')
    if error is not None:
        return error
    if request.method != 'POST':
        return JsonResponse({'message': 'Không tìm thấy chức năng.'}, status=404)
    now = int(time.time() * 1000)
    try:
        body = read_json(request)
        # Commit failed-attempt accounting independently of the redemption transaction.
        with transaction.atomic():
            get_user_model().objects.select_for_update().get(pk=request.user.pk)
            attempts, _ = QuestCodeAttempts.objects.get_or_create(user=request.user)
            if attempts.expires_at <= now:
                attempts.count, attempts.expires_at = 0, now + 60_000
            attempts.count += 1
            attempts.save()
        if attempts.count > 10:
            raise GameError(429, 'Bạn đã thử quá nhiều mã. Hãy chờ một phút rồi thử lại.')
        raw = body.get('code') if isinstance(body, dict) else None
        code = re.sub(r'[\s-]', '', raw).upper() if isinstance(raw, str) else ''
        if not re.fullmatch(r'DQ[A-F0-9]{24}', code):
            raise GameError(400, 'Mã không hợp lệ. Hãy kiểm tra mã Dana Quest đã nhận.')
        digest = hashlib.sha256(code.encode()).hexdigest()
        with transaction.atomic():
            row = QuestActivationCode.objects.select_for_update().filter(digest=digest).first()
            if row is None:
                raise GameError(400, 'Không tìm thấy mã Dana Quest này.')
            if row.revoked or (row.redeemed_at is not None and row.user_id is None):
                raise GameError(410, 'Mã đã bị thu hồi và không thể sử dụng lại.')
            if row.user_id is not None and row.user_id != request.user.pk:
                raise GameError(409, 'Mã đã được sử dụng bởi một tài khoản khác.')
            if row.user_id is None and row.expires_at <= now:
                raise GameError(410, 'Mã đã hết hạn sử dụng.')
            if row.user_id is None:
                claimed = QuestActivationCode.objects.filter(pk=row.pk, user__isnull=True, redeemed_at__isnull=True, revoked=False).update(user=request.user, redeemed_at=now)
                if not claimed:
                    raise GameError(409, 'Mã đã được sử dụng bởi một tài khoản khác.')
                row.refresh_from_db()
            result = {'questId': row.quest_id, 'redeemedAt': row.redeemed_at}
        return JsonResponse(result)
    except GameError as error:
        return error_response(error)
    except OperationalError:
        return JsonResponse({'message': 'Kho mã đang bận. Vui lòng thử lại.'}, status=503)
