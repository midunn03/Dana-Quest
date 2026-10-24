from datetime import date, time

from django.core.management.base import BaseCommand

from events.models import Event
from pixels.models import Place

DANANG_6M = 'https://danangfantasticity.com/vi/kham-pha/le-hoi-su-kien-da-nang-6-thang-cuoi-nam-2026'


class Command(BaseCommand):
    help = 'Tạo sự kiện MẪU để thử giao diện và thông báo. Hãy chỉnh lại giờ và ngày thật trong trang admin.'

    def handle(self, *args, **options):
        place, _ = Place.objects.get_or_create(slug='cau-rong', defaults={'name': 'Cầu Rồng', 'marker_meters': 320})
        samples = [
            dict(title='Cầu Rồng phun lửa & phun nước (mẫu)', defaults=dict(
                place=place, kind='show', weekdays='5', start_time=time(16, 0), end_time=time(18, 0),
                notify_radius_m=2000, notify_before_minutes=30,
                description='Sự kiện mẫu để thử giao diện. Hãy sửa giờ và ngày theo lịch thật.')),
            dict(title='Da Nang Christmas Market 2026 (mẫu)', defaults=dict(
                kind='market', start_date=date(2026, 12, 4), end_date=date(2026, 12, 6), start_time=time(9, 0), end_time=time(22, 0),
                is_featured=True, notify_radius_m=0, notify_before_minutes=60, source_url=DANANG_6M,
                description='Không gian Giáng sinh tại Ariyana Convention Centre Đà Nẵng. Giờ trong ngày là giá trị mẫu, hãy sửa theo thông báo chính thức.')),
            dict(title='Hoạt động Ngày Di sản văn hóa Việt Nam (mẫu)', defaults=dict(
                kind='festival', start_date=date(2026, 11, 23), end_date=date(2026, 12, 7), start_time=time(8, 0), end_time=time(21, 0),
                is_featured=True, notify_radius_m=0, notify_before_minutes=60, source_url=DANANG_6M,
                description='Chuỗi hoạt động tại khu phố cổ Hội An; thời gian dự kiến, hãy kiểm tra nguồn chính thức.')),
        ]
        made = 0
        for sample in samples:
            _, created = Event.objects.get_or_create(title=sample['title'], defaults=sample['defaults'])
            made += created
        self.stdout.write(f'Đã tạo {made} sự kiện mẫu (các sự kiện đã có thì giữ nguyên).')
