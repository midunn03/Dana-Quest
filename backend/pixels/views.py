from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import Place, PlaceSprite
from accounts.ownership import public_owner_checked


def place_payload(place, position):
    """Một địa điểm đầy đủ để giao diện hiển thị (không cần nội dung có sẵn trong code)."""
    return {
        'id': place.slug, 'name': place.name, 'lat': position[0], 'lng': position[1], 'category': place.category,
        'area': place.area, 'tags': place.tag_list(), 'featuredScore': place.featured_score,
        'highlight': place.highlight_reason, 'description': place.description, 'detail': place.detail,
        'activities': place.activity_list(), 'hours': place.hours, 'hoursNote': place.hours_note,
        'tip': place.tip, 'address': place.address, 'crowd': place.crowd_list(), 'crowdNote': place.crowd_note,
        'photos': [{'url': photo.image.url, 'caption': photo.caption, 'credit': photo.credit} for photo in place.photos.all()],
    }


@public_owner_checked
@require_GET
def places(request):
    """Dữ liệu địa điểm cho giao diện.

    managed: đã có địa điểm trong admin → giao diện dùng danh sách này thay cho danh sách mẫu trong code
    places:  các địa điểm đang bật (đủ nội dung, ảnh)
    items:   {mã: {url, meters, ground?}} — ảnh pixel đang dùng (ground = dán xuống mặt đất)
    """
    rows = list(Place.objects.prefetch_related('photos'))
    listed = {}
    for place in rows:
        position = place.position()
        if place.is_active and position:
            listed[place.slug] = place_payload(place, position)

    items = {}
    for sprite in PlaceSprite.objects.filter(is_active=True, place__is_active=True).select_related('place'):
        entry = {'url': sprite.image.url, 'meters': sprite.place.marker_meters}
        if sprite.is_ground:
            lat, lng = sprite.ground_lat, sprite.ground_lng
            if lat is None or lng is None:
                position = sprite.place.position()
                lat, lng = position if position else (None, None)
            if lat is not None and lng is not None:
                entry['ground'] = {'lat': lat, 'lng': lng, 'widthM': sprite.ground_width_m,
                                   'heightM': sprite.ground_height_m, 'rotation': sprite.ground_rotation}
        items[sprite.place.slug] = entry
    return JsonResponse({'managed': bool(rows), 'places': list(listed.values()), 'items': items})
