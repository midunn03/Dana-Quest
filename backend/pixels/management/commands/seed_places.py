import json
from pathlib import Path

from django.core.management.base import BaseCommand

from pixels.models import Place

SEED = Path(__file__).resolve().parents[2] / 'seed_places.json'


class Command(BaseCommand):
    help = ('Nhập 15 địa điểm mẫu (tên, tọa độ, giới thiệu, giờ mở cửa) vào admin để chỉnh sửa. '
            'Chỉ điền vào ô còn TRỐNG, không ghi đè nội dung bạn đã sửa. Chạy lại nhiều lần vẫn an toàn.')

    def handle(self, *args, **options):
        with open(SEED, encoding='utf-8') as handle:
            records = json.load(handle)
        created = filled = 0
        for record in records:
            place, is_new = Place.objects.get_or_create(slug=record['slug'], defaults={'name': record['name']})
            values = {
                'category': record['category'], 'latitude': record['latitude'], 'longitude': record['longitude'],
                'area': record['area'], 'tags': ', '.join(record['tags']), 'highlight_reason': record['highlight_reason'],
                'description': record['description'], 'detail': record['detail'], 'activities': '\n'.join(record['activities']),
                'hours': record['hours'], 'hours_note': record['hours_note'], 'address': record['address'],
            }
            changed = False
            for field, value in values.items():
                current = getattr(place, field)
                if current in (None, '') and value not in (None, ''):
                    setattr(place, field, value)
                    changed = True
            if is_new:  # chỉ đặt cho địa điểm mới; địa điểm đã có thì giữ nguyên cài đặt của bạn
                place.featured_score = record['featured_score']
                place.marker_meters = record['marker_meters']
                changed = True
            if changed:
                place.save()
                created += is_new
                filled += not is_new
        self.stdout.write(f'Xong: tạo mới {created} địa điểm, bổ sung chỗ trống cho {filled} địa điểm đã có.')
