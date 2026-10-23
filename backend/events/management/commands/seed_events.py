from datetime import time

from django.core.management.base import BaseCommand

from events.models import Event
from pixels.models import Place


class Command(BaseCommand):
    help = 'Tạo sự kiện MẪU (Cầu Rồng) để thử giao diện. Hãy chỉnh lại giờ thật trong trang admin.'

    def handle(self, *args, **options):
        place, _ = Place.objects.get_or_create(slug='cau-rong', defaults={'name': 'Cầu Rồng', 'marker_meters': 160})
        event, created = Event.objects.get_or_create(
            title='Cầu Rồng phun lửa & phun nước (mẫu)',
            defaults={'place': place, 'kind': 'show', 'weekdays': '5', 'start_time': time(16, 0), 'end_time': time(18, 0),
                      'description': 'Sự kiện mẫu để thử giao diện. Hãy sửa giờ và ngày theo lịch thật.'})
        self.stdout.write('Đã tạo sự kiện mẫu.' if created else 'Sự kiện mẫu đã có sẵn.')
