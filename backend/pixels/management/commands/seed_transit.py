from django.core.management.base import BaseCommand
from pixels.models import TransitStation

DEFAULT_STATIONS = [
    {
        'station_id': 'tngo-bao-tang-cham',
        'name': 'Trạm TNGo - Bảo tàng Điêu khắc Chăm',
        'transit_type': 'bike',
        'latitude': 16.0598,
        'longitude': 108.2230,
        'address': 'Số 02 đường 2 Tháng 9, P. Bình Hiên, Hải Châu',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'tngo-cong-vien-apec',
        'name': 'Trạm TNGo - Công viên APEC',
        'transit_type': 'bike',
        'latitude': 16.0585,
        'longitude': 108.2227,
        'address': 'Đường Bạch Đằng nối dài, P. Bình Hiên, Hải Châu',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'tngo-cau-song-han',
        'name': 'Trạm TNGo - Cầu Sông Hàn',
        'transit_type': 'bike',
        'latitude': 16.0718,
        'longitude': 108.2241,
        'address': 'Giao lộ Lê Duẩn - Bạch Đằng (đối diện 68 Bạch Đằng), Hải Châu',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'tngo-cho-han',
        'name': 'Trạm TNGo - Chợ Hàn',
        'transit_type': 'bike',
        'latitude': 16.0682,
        'longitude': 108.2245,
        'address': 'Đường Trần Phú / Hùng Vương, Hải Châu',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'tngo-bien-dong',
        'name': 'Trạm TNGo - Công viên Biển Đông',
        'transit_type': 'bike',
        'latitude': 16.0715,
        'longitude': 108.2475,
        'address': 'Đường Võ Nguyên Giáp / Phạm Văn Đồng, Sơn Trà',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'tngo-due',
        'name': 'Trạm TNGo - Đại học Kinh tế (DUE)',
        'transit_type': 'bike',
        'latitude': 16.0468,
        'longitude': 108.2375,
        'address': '71 Ngũ Hành Sơn, Bắc Mỹ An, Ngũ Hành Sơn',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'tngo-bien-my-khe',
        'name': 'Trạm TNGo - Bãi biển Mỹ Khê',
        'transit_type': 'bike',
        'latitude': 16.0655,
        'longitude': 108.2468,
        'address': 'Đường Võ Nguyên Giáp, Sơn Trà',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'tngo-cau-rong-tay',
        'name': 'Trạm TNGo - Đuôi Cầu Rồng (Bờ Tây)',
        'transit_type': 'bike',
        'latitude': 16.0601,
        'longitude': 108.2215,
        'address': 'Đường Bạch Đằng / 2 Tháng 9, P. Bình Hiên, Hải Châu',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': False,  # Điểm gần mép cầu, giữ unverified để admin đối chiếu lại vị trí
    },
    {
        'station_id': 'tngo-cau-rong-dong',
        'name': 'Trạm TNGo - Đầu Cầu Rồng (Bờ Đông)',
        'transit_type': 'bike',
        'latitude': 16.0617,
        'longitude': 108.2325,
        'address': 'Đường Võ Văn Kiệt / Trần Hưng Đạo, Sơn Trà',
        'operator': 'TNGo (Tập đoàn Trí Nam)',
        'source_url': 'https://danangfantasticity.com/cam-nang-du-lich/trai-nghiem-dich-vu-xe-dap-cong-cong-tngo-tai-da-nang.html',
        'bonus_coins': 5,
        'is_confirmed': False,  # Điểm gần mép cầu, giữ unverified để admin đối chiếu lại vị trí
    },
    {
        'station_id': 'danabus-cham',
        'name': 'Điểm xe buýt DanaBus - Bảo tàng Điêu khắc Chăm',
        'transit_type': 'bus',
        'latitude': 16.0592,
        'longitude': 108.2238,
        'address': 'Đường 2 Tháng 9, Hải Châu',
        'operator': 'DanaBus (Datram)',
        'source_url': 'https://www.danangbus.vn',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'danabus-cau-rong',
        'name': 'Điểm xe buýt DanaBus - Cầu Rồng',
        'transit_type': 'bus',
        'latitude': 16.0608,
        'longitude': 108.2220,
        'address': 'Đường 2 Tháng 9, Hải Châu',
        'operator': 'DanaBus (Datram)',
        'source_url': 'https://www.danangbus.vn',
        'bonus_coins': 5,
        'is_confirmed': False,  # Đã loại bỏ số tuyến cũ R4A/R16, cần xác minh số hiệu tuyến mới
    },
    {
        'station_id': 'danabus-my-khe',
        'name': 'Điểm xe buýt DanaBus - Tuyến ven biển Võ Nguyên Giáp',
        'transit_type': 'bus',
        'latitude': 16.0660,
        'longitude': 108.2462,
        'address': 'Đường Võ Nguyên Giáp, Sơn Trà',
        'operator': 'DanaBus (Datram)',
        'source_url': 'https://www.danangbus.vn',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
    {
        'station_id': 'danabus-due',
        'name': 'Điểm xe buýt DanaBus - Đại học Kinh tế (DUE)',
        'transit_type': 'bus',
        'latitude': 16.0475,
        'longitude': 108.2368,
        'address': 'Đường Ngũ Hành Sơn, Ngũ Hành Sơn',
        'operator': 'DanaBus (Datram)',
        'source_url': 'https://www.danangbus.vn',
        'bonus_coins': 5,
        'is_confirmed': True,
    },
]


class Command(BaseCommand):
    help = 'Nạp danh sách trạm di chuyển xanh (TNGo, DanaBus) vào Django Admin với verified=False mặc định.'

    def add_arguments(self, parser):
        parser.add_argument(
            '--verify-confirmed',
            action='store_true',
            help='Tự động đánh dấu verified=True cho các trạm đã được đối chiếu nguồn chính thức.',
        )

    def handle(self, *args, **options):
        verify_confirmed = options.get('verify_confirmed', False)
        created = updated = 0
        for item in DEFAULT_STATIONS:
            verified_val = item['is_confirmed'] if verify_confirmed else False
            defaults = {
                'name': item['name'],
                'transit_type': item['transit_type'],
                'latitude': item['latitude'],
                'longitude': item['longitude'],
                'address': item['address'],
                'operator': item['operator'],
                'source_url': item['source_url'],
                'verified': verified_val,
                'bonus_coins': item['bonus_coins'],
                'is_active': True,
            }
            station, is_new = TransitStation.objects.get_or_create(
                station_id=item['station_id'],
                defaults=defaults,
            )
            if not is_new:
                # Không ghi đè nếu admin đã chỉnh sửa, chỉ cập nhật nếu còn trống
                changed = False
                for field in ['operator', 'source_url', 'address']:
                    if not getattr(station, field) and defaults[field]:
                        setattr(station, field, defaults[field])
                        changed = True
                if verify_confirmed and item['is_confirmed'] and not station.verified:
                    station.verified = True
                    changed = True
                if changed:
                    station.save()
                    updated += 1
            else:
                created += 1

        total = TransitStation.objects.count()
        verified_count = TransitStation.objects.filter(verified=True).count()
        self.stdout.write(
            self.style.SUCCESS(
                f'Xong: Tao moi {created} tram, cap nhat {updated} tram. Tong: {total} tram ({verified_count} da xac minh).'
            )
        )
