from datetime import date
from django.core.management.base import BaseCommand
from game.models import PartnerVoucher
from pixels.models import Place


SAMPLE_PLACES = [
    {
        'slug': 'mi-quang-mau',
        'name': 'Mì Quảng Đà Nẵng (Quán Mẫu)',
        'category': 'food',
        'latitude': 16.068,
        'longitude': 108.221,
        'area': 'Hải Châu, Đà Nẵng',
        'address': 'Khu phố ẩm thực Hải Châu (địa điểm mẫu)',
        'description': 'Món mì Quảng truyền thống đậm đà phong vị xứ Quảng.',
        'tags': 'ẩm thực, mì quảng, đặc sản',
    },
    {
        'slug': 'banh-trang-thit-heo-mau',
        'name': 'Bánh Tráng Cuốn Thịt Heo (Quán Mẫu)',
        'category': 'food',
        'latitude': 16.052,
        'longitude': 108.239,
        'area': 'Ngũ Hành Sơn, Đà Nẵng',
        'address': 'Đường Ngũ Hành Sơn (địa điểm mẫu)',
        'description': 'Đặc sản bánh tráng cuốn thịt heo hai đầu da chấm mắm nêm danh tiếng.',
        'tags': 'ẩm thực, bánh tráng, đặc sản',
    },
]

SAMPLE_VOUCHERS = [
    {
        'code_prefix': 'MIQUANG',
        'partner_name': 'Mì Quảng Đà Nẵng (Đối tác Mẫu)',
        'destination_id': 'mi-quang-mau',
        'title': 'Giảm 25.000đ cho phần ăn từ 60.000đ',
        'description': 'Áp dụng cho 01 hóa đơn tại quán đối tác mẫu. Mỗi mã dùng đúng 1 lần.',
        'coin_cost': 30,
        'total_quantity': 50,
        'remaining_quantity': 50,
        'expires_at': date(2027, 12, 31),
        'is_sample': True,
    },
    {
        'code_prefix': 'BANHTRANG',
        'partner_name': 'Bánh Tráng Cuốn Thịt Heo (Đối tác Mẫu)',
        'destination_id': 'banh-trang-thit-heo-mau',
        'title': 'Tặng 01 phần nước uống giải khát hoặc tráng miệng',
        'description': 'Áp dụng khi dùng món tại quán mẫu. Đổi mã tại quầy thu ngân.',
        'coin_cost': 20,
        'total_quantity': 50,
        'remaining_quantity': 50,
        'expires_at': date(2027, 12, 31),
        'is_sample': True,
    },
]


class Command(BaseCommand):
    help = 'Nap dia diem am thuc va voucher doi tac mau (ghi ro Mau)'

    def handle(self, *args, **options):
        p_count = 0
        for p in SAMPLE_PLACES:
            _, created = Place.objects.update_or_create(
                slug=p['slug'],
                defaults={
                    'name': p['name'],
                    'category': p['category'],
                    'latitude': p['latitude'],
                    'longitude': p['longitude'],
                    'area': p['area'],
                    'address': p['address'],
                    'description': p['description'],
                    'tags': p['tags'],
                    'is_active': True,
                }
            )
            if created:
                p_count += 1

        v_count = 0
        for v in SAMPLE_VOUCHERS:
            _, created = PartnerVoucher.objects.update_or_create(
                code_prefix=v['code_prefix'],
                defaults={
                    'partner_name': v['partner_name'],
                    'destination_id': v['destination_id'],
                    'title': v['title'],
                    'description': v['description'],
                    'coin_cost': v['coin_cost'],
                    'total_quantity': v['total_quantity'],
                    'remaining_quantity': v['remaining_quantity'],
                    'expires_at': v['expires_at'],
                    'is_sample': v['is_sample'],
                    'is_active': True,
                }
            )
            if created:
                v_count += 1

        self.stdout.write(
            self.style.SUCCESS(
                f'Xong: Dong bo {len(SAMPLE_PLACES)} dia diem am thuc, {len(SAMPLE_VOUCHERS)} voucher doi tac mau.'
            )
        )
