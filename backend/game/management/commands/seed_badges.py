from django.core.management.base import BaseCommand
from game.models import BadgeTheme, Badge


BADGE_DATA = [
    {
        'slug': 'cau-da-nang',
        'name': 'Cầu Đà Nẵng',
        'description': 'Bộ sưu tập những cây cầu huyền thoại bắc qua dòng sông Hàn thơ mộng.',
        'icon': '🌉',
        'order': 1,
        'completion_bonus_coins': 50,
        'completion_bonus_xp': 100,
        'badges': [
            {
                'badge_id': 'cau-rong',
                'title': 'Rồng Thép Vươn Biển',
                'description': 'Ghé thăm Cầu Rồng biểu tượng kiến trúc của Đà Nẵng hiện đại.',
                'rarity': 'common',
                'icon_placeholder': '🐉',
                'required_destinations': ['cau-rong'],
                'bonus_coins': 15,
                'bonus_xp': 20,
                'order': 1,
            },
            {
                'badge_id': 'cau-song-han',
                'title': 'Cầu Quay Độc Bản',
                'description': 'Khám phá Cầu Sông Hàn, cây cầu quay đầu tiên do kỹ sư Việt Nam thiết kế và thi công.',
                'rarity': 'common',
                'icon_placeholder': '🔄',
                'required_destinations': ['cau-song-han'],
                'bonus_coins': 15,
                'bonus_xp': 20,
                'order': 2,
            },
            {
                'badge_id': 'cau-thuan-phuoc',
                'title': 'Dải Lụa Cửa Biển',
                'description': 'Chinh phục Cầu Thuận Phước, cây cầu treo dây võng dài nhất Việt Nam.',
                'rarity': 'rare',
                'icon_placeholder': '🌉',
                'required_destinations': ['cau-thuan-phuoc'],
                'bonus_coins': 25,
                'bonus_xp': 30,
                'order': 3,
            },
            {
                'badge_id': 'cau-tran-thi-ly',
                'title': 'Cánh Buồm No Gió',
                'description': 'Chiêm ngưỡng Cầu Trần Thị Lý với trụ tháp nghiêng độc đáo vươn cao 145m.',
                'rarity': 'rare',
                'icon_placeholder': '⛵',
                'required_destinations': ['cau-tran-thi-ly'],
                'bonus_coins': 25,
                'bonus_xp': 30,
                'order': 4,
            },
        ],
    },
    {
        'slug': 'bien-da-nang',
        'name': 'Biển Đà Nẵng',
        'description': 'Hành trình trải nghiệm bờ biển cát trắng và thiên nhiên biển đảo tuyệt đẹp.',
        'icon': '🌊',
        'order': 2,
        'completion_bonus_coins': 50,
        'completion_bonus_xp': 100,
        'badges': [
            {
                'badge_id': 'my-khe',
                'title': 'Sóng Xanh Mỹ Khê',
                'description': 'Ghé thăm bãi biển Mỹ Khê quyến rũ hàng đầu hành tinh.',
                'rarity': 'common',
                'icon_placeholder': '🏖️',
                'required_destinations': ['my-khe', 'bien-my-khe'],
                'bonus_coins': 15,
                'bonus_xp': 20,
                'order': 1,
            },
            {
                'badge_id': 'non-nuoc',
                'title': 'Cát Trắng Non Nước',
                'description': 'Dạo bước bên bờ biển nguyên sơ dưới chân Ngũ Hành Sơn.',
                'rarity': 'common',
                'icon_placeholder': '🐚',
                'required_destinations': ['non-nuoc', 'bien-non-nuoc'],
                'bonus_coins': 15,
                'bonus_xp': 20,
                'order': 2,
            },
            {
                'badge_id': 'son-tra',
                'title': 'Bảo Vật Bán Đảo',
                'description': 'Khám phá bán đảo Sơn Trà, Bãi Bụt và rừng nguyên sinh giáp biển.',
                'rarity': 'rare',
                'icon_placeholder': '🐒',
                'required_destinations': ['son-tra', 'chua-linh-ung-son-tra'],
                'bonus_coins': 30,
                'bonus_xp': 50,
                'order': 3,
            },
        ],
    },
    {
        'slug': 'am-thuc',
        'name': 'Ẩm thực Đà Thành',
        'description': 'Hương vị đậm đà miền Trung từ các món ăn đặc sản nổi danh.',
        'icon': '🍜',
        'order': 3,
        'completion_bonus_coins': 50,
        'completion_bonus_xp': 100,
        'badges': [
            {
                'badge_id': 'mi-quang',
                'title': 'Đậm Đà Mì Quảng',
                'description': 'Thưởng thức món mì Quảng sợi mềm nước nhưn đậm vị tinh hoa Quảng - Đà.',
                'rarity': 'common',
                'icon_placeholder': '🍜',
                'required_destinations': ['mi-quang', 'quan-mi-quang'],
                'bonus_coins': 15,
                'bonus_xp': 20,
                'order': 1,
            },
            {
                'badge_id': 'banh-trang-thit-heo',
                'title': 'Bánh Tráng Cuốn Hai Đầu Da',
                'description': 'Trải nghiệm bánh tráng cuốn thịt heo chấm mắm nêm danh bất hư truyền.',
                'rarity': 'common',
                'icon_placeholder': '🌯',
                'required_destinations': ['banh-trang-thit-heo'],
                'bonus_coins': 15,
                'bonus_xp': 20,
                'order': 2,
            },
            {
                'badge_id': 'cho-con',
                'title': 'Thiên Đường Chợ Cồn',
                'description': 'Oanh tạc khu ẩm thực nức tiếng Chợ Cồn và Chợ Hàn.',
                'rarity': 'rare',
                'icon_placeholder': '🍢',
                'required_destinations': ['cho-con', 'cho-han'],
                'bonus_coins': 25,
                'bonus_xp': 40,
                'order': 3,
            },
        ],
    },
    {
        'slug': 'van-hoa-cham',
        'name': 'Văn hóa Chăm',
        'description': 'Dấu ấn lịch sử và nghệ thuật điêu khắc Champa cổ kính trên đất Đà Nẵng.',
        'icon': '🏛️',
        'order': 4,
        'completion_bonus_coins': 50,
        'completion_bonus_xp': 100,
        'badges': [
            {
                'badge_id': 'bao-tang-cham',
                'title': 'Di Sản Điêu Khắc',
                'description': 'Chiêm ngưỡng bộ sưu tập hiện vật điêu khắc Chăm quy mô lớn nhất thế giới.',
                'rarity': 'common',
                'icon_placeholder': '🗿',
                'required_destinations': ['bao-tang-cham', 'bao-tang-dieu-khac-cham'],
                'bonus_coins': 20,
                'bonus_xp': 30,
                'order': 1,
            },
            {
                'badge_id': 'ngu-hanh-son',
                'title': 'Huyền Bí Năm Ngọn Núi',
                'description': 'Khám phá quần thể hang động và chùa chiền tại danh thắng Ngũ Hành Sơn.',
                'rarity': 'rare',
                'icon_placeholder': '⛰️',
                'required_destinations': ['ngu-hanh-son'],
                'bonus_coins': 30,
                'bonus_xp': 40,
                'order': 2,
            },
            {
                'badge_id': 'lang-da-non-nuoc',
                'title': 'Tinh Hoa Làng Đá',
                'description': 'Ghé thăm làng nghề điêu khắc đá mỹ nghệ Non Nước hơn 300 năm tuổi.',
                'rarity': 'common',
                'icon_placeholder': '🔨',
                'required_destinations': ['lang-da-non-nuoc'],
                'bonus_coins': 15,
                'bonus_xp': 20,
                'order': 3,
            },
        ],
    },
]


class Command(BaseCommand):
    help = 'Nap 4 chu de huy hieu mau va cac huy hieu lien quan'

    def handle(self, *args, **options):
        theme_count = 0
        badge_count = 0
        for t_data in BADGE_DATA:
            theme, created = BadgeTheme.objects.update_or_create(
                slug=t_data['slug'],
                defaults={
                    'name': t_data['name'],
                    'description': t_data['description'],
                    'icon': t_data['icon'],
                    'order': t_data['order'],
                    'completion_bonus_coins': t_data['completion_bonus_coins'],
                    'completion_bonus_xp': t_data['completion_bonus_xp'],
                }
            )
            if created:
                theme_count += 1

            for b_data in t_data['badges']:
                _, b_created = Badge.objects.update_or_create(
                    badge_id=b_data['badge_id'],
                    defaults={
                        'theme': theme,
                        'title': b_data['title'],
                        'description': b_data['description'],
                        'rarity': b_data['rarity'],
                        'icon_placeholder': b_data['icon_placeholder'],
                        'required_destinations': b_data['required_destinations'],
                        'bonus_coins': b_data['bonus_coins'],
                        'bonus_xp': b_data['bonus_xp'],
                        'order': b_data['order'],
                        'is_active': True,
                    }
                )
                if b_created:
                    badge_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Xong: Tao moi {theme_count} chu de, {badge_count} huy hieu.'
            )
        )
