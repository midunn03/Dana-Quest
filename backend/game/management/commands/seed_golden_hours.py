from django.core.management.base import BaseCommand
from game.models import GoldenHourChallenge


GOLDEN_HOUR_DATA = [
    {
        'destination_id': 'cau-rong',
        'title': 'Cầu Rồng Phun Lửa & Phun Nước',
        'description': 'Màn trình diễn phun lửa và nước huyền thoại tại biểu tượng Đà Nẵng.',
        'days_of_week': [4, 5, 6],
        'start_time': '20:30:00',
        'end_time': '21:30:00',
        'bonus_coins': 20,
        'multiplier': 2.0,
        'latitude': 16.061,
        'longitude': 108.227,
        'radius_meters': 150,
    },
    {
        'destination_id': 'son-tra',
        'title': 'Bình Minh Sơn Trà & Đón Ban Mai',
        'description': 'Đón ánh mặt trời đầu ngày trên đỉnh bán đảo Sơn Trà.',
        'days_of_week': [0, 1, 2, 3, 4, 5, 6],
        'start_time': '05:00:00',
        'end_time': '06:30:00',
        'bonus_coins': 25,
        'multiplier': 1.5,
        'latitude': 16.103,
        'longitude': 108.277,
        'radius_meters': 300,
    },
]


class Command(BaseCommand):
    help = 'Nap cac thu thach gio vang mac dinh'

    def handle(self, *args, **options):
        count = 0
        for item in GOLDEN_HOUR_DATA:
            _, created = GoldenHourChallenge.objects.update_or_create(
                destination_id=item['destination_id'],
                start_time=item['start_time'],
                defaults={
                    'title': item['title'],
                    'description': item['description'],
                    'days_of_week': item['days_of_week'],
                    'end_time': item['end_time'],
                    'bonus_coins': item['bonus_coins'],
                    'multiplier': item['multiplier'],
                    'latitude': item['latitude'],
                    'longitude': item['longitude'],
                    'radius_meters': item['radius_meters'],
                    'is_active': True,
                }
            )
            count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Xong: Da dong bo {count} thu thach gio vang.'
            )
        )
