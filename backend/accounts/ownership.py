from django.http import JsonResponse
from functools import wraps

OWNER_CHANGED = 'Tài khoản đã thay đổi ở tab khác. Hãy tải lại trang.'


def owner_error(request, *, bootstrap=False):
    """Bind private requests to the account captured by the browser tab.

    Session bootstrap may omit the owner because its purpose is to discover it.
    A supplied stale header is never accepted, including during bootstrap.
    """
    supplied = request.headers.get('X-Dana-User')
    if bootstrap and supplied is None:
        return None
    if supplied != str(request.user.pk):
        return JsonResponse({'message': OWNER_CHANGED}, status=409)
    return None


def public_owner_checked(view):
    """Public catalogs stay anonymous; reject an explicitly stale signed-in tab."""
    @wraps(view)
    def checked(request, *args, **kwargs):
        if request.user.is_authenticated and request.headers.get('X-Dana-User') is not None:
            error = owner_error(request)
            if error is not None:
                return error
        return view(request, *args, **kwargs)
    return checked
