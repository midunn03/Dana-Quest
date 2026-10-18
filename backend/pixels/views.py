from django.http import JsonResponse
from django.views.decorators.http import require_GET

from .models import PlaceSprite


@require_GET
def places(request):
    """Trả về ảnh pixel đang được chọn cho từng địa điểm: {items: {slug: {url, meters}}}."""
    items = {}
    for sprite in PlaceSprite.objects.filter(is_active=True).select_related('place'):
        items[sprite.place.slug] = {'url': sprite.image.url, 'meters': sprite.place.marker_meters}
    return JsonResponse({'items': items})
