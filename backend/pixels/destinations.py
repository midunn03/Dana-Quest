"""Đọc danh sách địa điểm mẫu của giao diện (src/data/destinations.json): lấy tọa độ dự phòng cho địa điểm chưa nhập tọa độ."""
import json
from pathlib import Path

from django.conf import settings

_cache = {}


def destination_data():
    """Trả về {mã: {'name', 'position': [vĩ độ, kinh độ], 'location'}}; rỗng nếu không đọc được tệp."""
    path = Path(getattr(settings, 'DESTINATIONS_JSON', Path(settings.BASE_DIR).parent / 'src' / 'data' / 'destinations.json'))
    try:
        stamp = path.stat().st_mtime
        cached = _cache.get(path)
        if cached and cached[0] == stamp:
            return cached[1]
        with open(path, encoding='utf-8') as handle:
            data = {item['id']: {'name': item['name'], 'position': item['position'], 'location': item.get('location', '')} for item in json.load(handle)}
        _cache[path] = (stamp, data)
        return data
    except (OSError, ValueError, KeyError):
        return {}
