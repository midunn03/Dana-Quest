"""Đọc danh sách địa điểm có sẵn của giao diện (src/data/destinations.json) để admin chọn đúng mã và lấy tọa độ."""
import json
from pathlib import Path

from django.conf import settings


def destination_data():
    """Trả về {mã: {'name': tên, 'position': [vĩ độ, kinh độ]}}; rỗng nếu không đọc được tệp."""
    path = Path(getattr(settings, 'DESTINATIONS_JSON', Path(settings.BASE_DIR).parent / 'src' / 'data' / 'destinations.json'))
    try:
        with open(path, encoding='utf-8') as handle:
            return {item['id']: {'name': item['name'], 'position': item['position']} for item in json.load(handle)}
    except (OSError, ValueError, KeyError):
        return {}
