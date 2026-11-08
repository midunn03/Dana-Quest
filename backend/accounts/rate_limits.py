import hashlib
import math
import time

from django.db import DatabaseError, transaction
from django.db.models import F
from django.http import JsonResponse

from .models import ApiRateBucket


def rate_response(status, retry_after):
    response = JsonResponse({'message': 'Bạn thao tác quá nhanh. Vui lòng thử lại sau.'
                             if status == 429 else 'Bộ giới hạn đang bận. Vui lòng thử lại sau.'}, status=status)
    response['Retry-After'] = str(max(1, retry_after))
    response['Cache-Control'] = 'no-store'
    return response


def check_limit(key, limit, duration_ms):
    """Atomic database counters, shared by workers using the same database."""
    now = int(time.time() * 1000)
    digest = hashlib.sha256(key.encode()).hexdigest()
    try:
        with transaction.atomic():
            ApiRateBucket.objects.filter(expires_ms__lte=now).delete()
            row, _ = ApiRateBucket.objects.get_or_create(key=digest, defaults={'expires_ms': now + duration_ms})
            updated = ApiRateBucket.objects.filter(key=digest, count__lt=limit).update(count=F('count') + 1)
            if not updated:
                return rate_response(429, math.ceil((row.expires_ms - now) / 1000))
    except DatabaseError:
        # Missing migrations or an unavailable counter store must not bypass limits.
        return rate_response(503, 60)
    return None


class ApiRateLimitMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        if request.path.startswith('/api/'):
            # Ignore X-Forwarded-For. Deployments must sanitize/set REMOTE_ADDR
            # in their trusted ingress rather than trusting a browser header.
            address = request.META.get('REMOTE_ADDR', 'unknown')
            error = check_limit(f'api-ip:{address}', 120, 60_000)
            if error is not None:
                return error
            if request.user.is_authenticated:
                error = check_limit(f'api-user:{request.user.pk}', 120, 60_000)
                if error is not None:
                    return error
            if request.path in ('/api/auth/login', '/api/auth/register'):
                error = check_limit(f'auth-ip:{address}', 15, 60_000)
                if error is not None:
                    return error
        return self.get_response(request)
