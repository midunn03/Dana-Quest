from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .destinations import destination_data
from .models import Place, PlaceSprite


@require_GET
def places(request):
    """Dữ liệu địa điểm cho giao diện.

    items:   {mã: {url, meters, ground?}} — ảnh pixel đang dùng (ground = dán xuống mặt đất)
    content: {mã: {...}} — nội dung trang chi tiết của các địa điểm bật "Dùng nội dung do admin viết"
    """
    known = destination_data()
    items = {}
    for sprite in PlaceSprite.objects.filter(is_active=True).select_related('place'):
        entry = {'url': sprite.image.url, 'meters': sprite.place.marker_meters}
        if sprite.is_ground:
            lat, lng = sprite.ground_lat, sprite.ground_lng
            if lat is None or lng is None:
                lat, lng = (known.get(sprite.place.slug) or {}).get('position', (None, None))
            if lat is not None and lng is not None:
                entry['ground'] = {'lat': lat, 'lng': lng, 'widthM': sprite.ground_width_m,
                                   'heightM': sprite.ground_height_m, 'rotation': sprite.ground_rotation}
        items[sprite.place.slug] = entry

    content = {}
    for place in Place.objects.filter(use_admin_content=True).prefetch_related('photos'):
        content[place.slug] = {
            'description': place.description, 'detail': place.detail, 'highlight': place.highlight_reason,
            'activities': place.activity_list(), 'hours': place.hours, 'hoursNote': place.hours_note,
            'tip': place.tip, 'address': place.address,
            'photos': [{'url': photo.image.url, 'caption': photo.caption, 'credit': photo.credit} for photo in place.photos.all()],
        }
    return JsonResponse({'items': items, 'content': content})
