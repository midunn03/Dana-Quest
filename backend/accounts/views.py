"""API tài khoản cho DANA QUEST.

Thay thế server/auth.mjs của bản Node. Giữ nguyên đường dẫn và dạng JSON để
giao diện React gần như không phải sửa:
  GET   /api/auth/session
  POST  /api/auth/register
  POST  /api/auth/login
  POST  /api/auth/logout
  PATCH /api/auth/profile
  PATCH /api/auth/profile/avatar

Mật khẩu được băm và phiên đăng nhập do Django quản lý (django.contrib.auth),
nên không cần tự viết scrypt hay bảng phiên như bản cũ.
"""
import json
import re

from django.contrib.auth import authenticate, get_user_model, login, logout
from django.db import IntegrityError, transaction
from django.http import JsonResponse
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .models import Profile

User = get_user_model()

EMAIL_RE = re.compile(r'^[^\s@]+@[^\s@]+\.[^\s@]+$')
AVATAR_IDS = {'bien', 'nang', 'rung', 'may'}
# Nhân vật tự tạo: c1.<giới tính>.<đầu>.<tóc>.<tay áo>.<quần>.<da>.<màu tóc>.<màu áo>.<màu quần>
CUSTOM_AVATAR_RE = re.compile(
    r'^c1\.[mf]\.(tron|vuong|to|det|xoan)\.(den|xu|haimai|mullet)\.(ngan|dai|coc)\.(dai|ngan)\.[0-9]\.[0-9]\.[0-9]\.[0-9]$')


def valid_avatar(value):
    return isinstance(value, str) and (value in AVATAR_IDS or bool(CUSTOM_AVATAR_RE.match(value)))


def fail(status, message):
    return JsonResponse({'message': message}, status=status)


def read_json(request):
    """Trả về dict JSON hợp lệ, hoặc None nếu dữ liệu sai."""
    try:
        data = json.loads(request.body or b'{}')
    except ValueError:
        return None
    return data if isinstance(data, dict) else None


def normalize_phone(value):
    """Chuẩn hóa số điện thoại Việt Nam về dạng +84..., trả '' nếu không hợp lệ."""
    if not value or not isinstance(value, str):
        return ''
    phone = re.sub(r'[ ()-]', '', value)
    if re.fullmatch(r'0[35789]\d{8}', phone):
        phone = '+84' + phone[1:]
    if re.fullmatch(r'84[35789]\d{8}', phone):
        phone = '+' + phone
    return phone if re.fullmatch(r'\+84[35789]\d{8}', phone) else ''


def public_user(user):
    profile, _ = Profile.objects.get_or_create(user=user)
    return {
        'id': str(user.pk),
        'name': user.username,
        'phone': profile.phone or '',
        'email': user.email,
        'avatarId': profile.avatar_id,
        'phoneVerifiedAt': None,
        'storageMode': 'account',
    }


def check_username(name, exclude_pk=None):
    """Trả về JsonResponse lỗi nếu tên không hợp lệ, hoặc None nếu ổn."""
    if not 2 <= len(name) <= 100:
        return fail(400, 'Tên đăng nhập phải từ 2 đến 100 ký tự.')
    # Cấm '@' để tên đăng nhập không thể trùng với email của người khác.
    if '@' in name:
        return fail(400, 'Tên đăng nhập không được chứa ký tự @.')
    query = User.objects.filter(username__iexact=name)
    if exclude_pk is not None:
        query = query.exclude(pk=exclude_pk)
    if query.exists():
        return fail(409, 'Tên người dùng này đã được đăng ký rồi.')
    return None


# ensure_csrf_cookie: trình duyệt nhận cookie "csrftoken" ngay lần đầu mở app,
# để các yêu cầu POST/PATCH sau đó gửi kèm header X-CSRFToken.
@ensure_csrf_cookie
@require_http_methods(['GET'])
def session(request):
    if not request.user.is_authenticated:
        return fail(401, 'Chưa đăng nhập.')
    return JsonResponse({'user': public_user(request.user)})


@require_http_methods(['POST'])
def register(request):
    data = read_json(request)
    if data is None:
        return fail(400, 'Dữ liệu không hợp lệ.')
    name = str(data.get('name') or data.get('username') or '').strip()
    email = str(data.get('email') or '').strip().lower()
    phone = normalize_phone(data.get('phone'))
    password = data.get('password')

    if not isinstance(password, str) or not 6 <= len(password) <= 128:
        return fail(400, 'Mật khẩu phải từ 6 đến 128 ký tự.')
    error = check_username(name)
    if error:
        return error
    if email and (not EMAIL_RE.match(email) or len(email) > 254):
        return fail(400, 'Email không hợp lệ.')
    if data.get('phone') and not phone:
        return fail(400, 'Số điện thoại không hợp lệ.')
    if email and User.objects.filter(email__iexact=email).exists():
        return fail(409, 'Email này đã được sử dụng.')
    if phone and Profile.objects.filter(phone=phone).exists():
        return fail(409, 'Số điện thoại này đã được sử dụng.')

    try:
        with transaction.atomic():
            user = User.objects.create_user(username=name, email=email, password=password)
            Profile.objects.create(user=user, phone=phone or None)
    except IntegrityError:
        return fail(409, 'Tên đăng nhập hoặc thông tin này đã được sử dụng.')
    login(request, user)
    return JsonResponse({'user': public_user(user)})


@require_http_methods(['POST'])
def login_view(request):
    data = read_json(request)
    if data is None:
        return fail(400, 'Dữ liệu không hợp lệ.')
    identifier = str(data.get('username') or data.get('name') or data.get('email') or '').strip()
    password = data.get('password')
    if not identifier:
        return fail(400, 'Vui lòng nhập tên đăng nhập hoặc email.')
    if not isinstance(password, str) or not 6 <= len(password) <= 128:
        return fail(400, 'Mật khẩu phải từ 6 đến 128 ký tự.')

    # Có '@' thì tìm theo email, ngược lại tìm theo tên đăng nhập.
    lookup = {'email__iexact': identifier} if '@' in identifier else {'username__iexact': identifier}
    found = User.objects.filter(**lookup).first()
    user = authenticate(request, username=found.username, password=password) if found else None
    if user is None:
        return fail(401, 'Tên đăng nhập / email hoặc mật khẩu không đúng.')
    login(request, user)
    return JsonResponse({'user': public_user(user)})


@require_http_methods(['POST'])
def logout_view(request):
    logout(request)
    return JsonResponse({'ok': True})


@require_http_methods(['PATCH'])
def avatar(request):
    if not request.user.is_authenticated:
        return fail(401, 'Chưa đăng nhập.')
    data = read_json(request)
    if data is None:
        return fail(400, 'Dữ liệu không hợp lệ.')
    if not valid_avatar(data.get('avatarId')):
        return fail(400, 'Nhân vật không hợp lệ.')
    profile, _ = Profile.objects.get_or_create(user=request.user)
    profile.avatar_id = data['avatarId']
    profile.save(update_fields=['avatar_id'])
    return JsonResponse({'user': public_user(request.user)})


@require_http_methods(['PATCH'])
def profile(request):
    if not request.user.is_authenticated:
        return fail(401, 'Chưa đăng nhập.')
    data = read_json(request)
    if data is None:
        return fail(400, 'Dữ liệu không hợp lệ.')
    user = request.user
    prof, _ = Profile.objects.get_or_create(user=user)

    name = data.get('name')
    new_name = name.strip() if isinstance(name, str) and name.strip() else user.username
    email = data.get('email')
    new_email = email.strip().lower() if isinstance(email, str) else user.email
    raw_phone = data.get('phone')
    if isinstance(raw_phone, str):
        new_phone = normalize_phone(raw_phone) if raw_phone.strip() else ''
        if raw_phone.strip() and not new_phone:
            return fail(400, 'Số điện thoại không hợp lệ.')
    else:
        new_phone = prof.phone or ''

    if new_name != user.username:
        error = check_username(new_name, exclude_pk=user.pk)
        if error:
            return error
    if new_email and (not EMAIL_RE.match(new_email) or len(new_email) > 254):
        return fail(400, 'Email không hợp lệ.')
    if new_email and User.objects.filter(email__iexact=new_email).exclude(pk=user.pk).exists():
        return fail(409, 'Email này đã được sử dụng.')
    if new_phone and Profile.objects.filter(phone=new_phone).exclude(pk=prof.pk).exists():
        return fail(409, 'Số điện thoại này đã được sử dụng.')

    try:
        with transaction.atomic():
            user.username = new_name
            user.email = new_email
            user.save(update_fields=['username', 'email'])
            prof.phone = new_phone or None
            prof.save(update_fields=['phone'])
    except IntegrityError:
        return fail(409, 'Thông tin này đã được sử dụng.')
    return JsonResponse({'user': public_user(user)})
