from datetime import datetime, timedelta

from django.db.models import Q
from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import VN_TZ, Event

SOON_MINUTES = 60


@require_GET
def feed(request):
    """Sự kiện đang diễn ra và sắp diễn ra (mặc định 30 ngày tới, tính theo giờ Việt Nam).

    status: 'live' đang diễn ra · 'soon' bắt đầu trong vòng 60 phút · 'later' để sau.
    """
    try:
        days = max(1, min(60, int(request.GET.get('days', 30))))
    except ValueError:
        days = 30
    now = datetime.now(VN_TZ)
    first = now.date() - timedelta(days=1)  # lấy cả lần diễn ra qua nửa đêm từ hôm qua
    last = now.date() + timedelta(days=days)
    items = []
    for event in Event.objects.filter(Q(place__isnull=True) | Q(place__is_active=True), is_active=True).select_related('place'):
        for start, end in event.occurrences(first, last):
            if end <= now:
                continue
            if start <= now:
                status, minutes = 'live', 0
            else:
                minutes = int((start - now).total_seconds() // 60)
                status = 'soon' if minutes <= SOON_MINUTES else 'later'
            position = event.place.position() if event.place else None
            items.append({
                'id': event.pk, 'title': event.title, 'description': event.description, 'kind': event.kind,
                'placeId': event.place.slug if event.place else None,
                'placeName': event.place.name if event.place else '',
                'placeLat': position[0] if position else None, 'placeLng': position[1] if position else None,
                'radiusM': event.notify_radius_m, 'notifyBefore': event.notify_before_minutes,
                'featured': event.is_featured, 'sourceUrl': event.source_url,
                'start': start.isoformat(), 'end': end.isoformat(),
                'status': status, 'minutesUntil': minutes,
            })
    items.sort(key=lambda item: item['start'])
    return JsonResponse({'now': now.isoformat(), 'items': items[:60]})
