from django.core.management.base import BaseCommand
from game.models import StreakMilestone


DEFAULT_MILESTONES = [
    {'days': 3, 'bonus_coins': 15, 'bonus_xp': 20, 'message': 'Khoi dau kien tri: 3 ngay kham pha lien tiep!'},
    {'days': 7, 'bonus_coins': 35, 'bonus_xp': 50, 'message': 'Tron mot tuan gan bo: 7 ngay kien cuong!'},
    {'days': 14, 'bonus_coins': 80, 'bonus_xp': 100, 'message': 'Nha tham hiem ban linh: 14 ngay dong hanh!'},
    {'days': 30, 'bonus_coins': 200, 'bonus_xp': 250, 'message': 'Huyen thoai kien dinh: 30 ngay chinh phuc Da Nang!'},
]


class Command(BaseCommand):
    help = 'Nap cac moc thuong Streak mac dinh vao he thong'

    def handle(self, *args, **options):
        created_count = 0
        updated_count = 0
        for item in DEFAULT_MILESTONES:
            obj, created = StreakMilestone.objects.update_or_create(
                days=item['days'],
                defaults={
                    'bonus_coins': item['bonus_coins'],
                    'bonus_xp': item['bonus_xp'],
                    'message': item['message'],
                    'is_active': True,
                }
            )
            if created:
                created_count += 1
            else:
                updated_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Xong: Tao moi {created_count} moc, cap nhat {updated_count} moc streak.'
            )
        )
