from django.conf import settings
from django.db import models


class GameState(models.Model):
    """Tiến độ nhiệm vụ, xu và voucher của một người chơi (dạng JSON, có số phiên bản)."""

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_state')
    revision = models.PositiveIntegerField('Phiên bản', default=0)
    state = models.JSONField('Tiến độ', default=dict)
    updated = models.DateTimeField('Cập nhật', auto_now=True)

    class Meta:
        verbose_name = 'tiến độ người chơi'
        verbose_name_plural = 'tiến độ người chơi'

    def __str__(self):
        return f'Tiến độ của {self.user.username}'


class GameStateBackup(models.Model):
    """Pre-reset progress snapshot; existing photo rows stay intact."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_state_backups')
    revision = models.PositiveIntegerField()
    state = models.JSONField()
    photos = models.JSONField(default=list)
    created = models.DateTimeField(auto_now_add=True)


class QuestRunState(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='quest_run_state')
    state = models.JSONField(default=dict)
    updated = models.DateTimeField(auto_now=True)


class QuestActivationCode(models.Model):
    digest = models.CharField(max_length=64, unique=True)
    quest_id = models.CharField(max_length=100)
    expires_at = models.BigIntegerField()
    created_ms = models.BigIntegerField()
    user = models.ForeignKey(settings.AUTH_USER_MODEL, null=True, blank=True, on_delete=models.SET_NULL)
    redeemed_at = models.BigIntegerField(null=True, blank=True)
    revoked = models.BooleanField(default=False)


class QuestCodeAttempts(models.Model):
    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    count = models.PositiveIntegerField(default=0)
    expires_at = models.BigIntegerField(default=0)


class GamePhoto(models.Model):
    """Ảnh nhiệm vụ của người chơi. Lưu trong cơ sở dữ liệu (riêng tư), không để ở thư mục /media công khai."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_photos')
    key = models.CharField('Mã ảnh', max_length=80, help_text='điểm-đến:nhiệm-vụ')
    destination_id = models.CharField('Địa điểm', max_length=60)
    mission_id = models.CharField('Nhiệm vụ', max_length=40)
    data = models.BinaryField('Ảnh JPEG')
    created_ms = models.BigIntegerField('Thời điểm (ms)')
    quarantined = models.BooleanField(default=False)

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'key'], name='one_photo_per_mission')]
        ordering = ['created_ms']
        verbose_name = 'ảnh nhiệm vụ'
        verbose_name_plural = 'ảnh nhiệm vụ'

    def __str__(self):
        return f'{self.user.username} · {self.key}'


class StreakMilestone(models.Model):
    """Cấu hình mốc thưởng chuỗi ngày (Streak) khám phá."""

    days = models.PositiveIntegerField('Số ngày mốc', unique=True, help_text='Ví dụ: 3, 7, 14, 30 ngày')
    bonus_coins = models.PositiveIntegerField('Xu thưởng', default=10)
    bonus_xp = models.PositiveIntegerField('XP thưởng', default=20)
    message = models.CharField('Thông báo chúc mừng', max_length=200, blank=True)
    is_active = models.BooleanField('Kích hoạt', default=True)

    class Meta:
        ordering = ['days']
        verbose_name = 'mốc thưởng streak'
        verbose_name_plural = 'các mốc thưởng streak'

    def __str__(self):
        return f'Mốc {self.days} ngày (+{self.bonus_coins} xu)'


class BadgeTheme(models.Model):
    """Chu de bo suu tap huy hieu (vi du: Cau Da Nang, Bien, Am thuc, Van hoa Cham)."""

    slug = models.SlugField('Ma dinh danh', max_length=50, unique=True)
    name = models.CharField('Ten chu de', max_length=100)
    description = models.TextField('Mo ta chu de', blank=True)
    icon = models.CharField('Bieu tuong dai dien', max_length=30, default='🏆')
    order = models.PositiveIntegerField('Thu tu hien thi', default=0)
    completion_bonus_coins = models.PositiveIntegerField('Xu thuong khi hoan thanh bo', default=50)
    completion_bonus_xp = models.PositiveIntegerField('XP thuong khi hoan thanh bo', default=100)

    class Meta:
        ordering = ['order', 'id']
        verbose_name = 'chu de huy hieu'
        verbose_name_plural = 'cac chu de huy hieu'

    def __str__(self):
        return self.name


class Badge(models.Model):
    """Huy hieu trong bo suu tap."""

    RARITY_CHOICES = [
        ('common', 'Thuong'),
        ('rare', 'Hiem'),
        ('legendary', 'Huyen thoai'),
    ]

    theme = models.ForeignKey(BadgeTheme, on_delete=models.CASCADE, related_name='badges', verbose_name='Chu de')
    badge_id = models.CharField('Ma huy hieu', max_length=60, unique=True)
    title = models.CharField('Ten huy hieu', max_length=100)
    description = models.TextField('Mo ta dieu kien dat duoc', blank=True)
    rarity = models.CharField('Do hiem', max_length=20, choices=RARITY_CHOICES, default='common')
    icon_placeholder = models.CharField('Bieu tuong giu cho', max_length=30, default='🎖️')
    image = models.ImageField('Hinh anh huy hieu', upload_to='badges/', blank=True, null=True)
    required_destinations = models.JSONField('Danh sach dia diem yeu cau', default=list, blank=True)
    required_count = models.PositiveIntegerField('So luong yeu cau', default=1)
    bonus_coins = models.PositiveIntegerField('Xu thuong', default=10)
    bonus_xp = models.PositiveIntegerField('XP thuong', default=20)
    order = models.PositiveIntegerField('Thu tu hien thi', default=0)
    is_active = models.BooleanField('Kich hoat', default=True)

    class Meta:
        ordering = ['theme__order', 'order', 'id']
        verbose_name = 'huy hieu'
        verbose_name_plural = 'danh sach huy hieu'

    def __str__(self):
        return f'{self.title} ({self.get_rarity_display()})'


class GoldenHourChallenge(models.Model):
    """Thu thach gio vang tai dia diem."""

    destination_id = models.CharField('Ma dia diem', max_length=60)
    title = models.CharField('Ten thu thach gio vang', max_length=100)
    description = models.TextField('Mo ta su kien gio vang', blank=True)
    days_of_week = models.JSONField('Cac thu trong tuan (0=T2, 6=CN)', default=list, help_text='Vi du: [4, 5, 6] cho T6, T7, CN')
    start_time = models.TimeField('Gio bat dau')
    end_time = models.TimeField('Gio ket thuc')
    bonus_coins = models.PositiveIntegerField('Xu thuong them', default=20)
    multiplier = models.FloatField('He so nhan thuong', default=1.5)
    latitude = models.FloatField('Vi do trung tam', default=16.061)
    longitude = models.FloatField('Kinh do trung tam', default=108.227)
    radius_meters = models.PositiveIntegerField('Ban kinh hop le (m)', default=120)
    is_active = models.BooleanField('Kich hoat', default=True)

    class Meta:
        ordering = ['destination_id', 'start_time']
        verbose_name = 'thu thach gio vang'
        verbose_name_plural = 'cac thu thach gio vang'

    def __str__(self):
        return f'{self.title} ({self.destination_id}: {self.start_time}-{self.end_time})'


class PartnerVoucher(models.Model):
    """Voucher uu dai tu doi tac / quan am thuc."""

    code_prefix = models.CharField('Tien to ma voucher', max_length=20, default='DANA', help_text='Vi du: MIQUANG, BANHTRANG')
    partner_name = models.CharField('Ten doi tac / Quan', max_length=120, help_text='Ghi ro (Mau) neu la du lieu thu nghiem')
    destination_id = models.CharField('Ma dia diem / Quan lien ket', max_length=60, blank=True)
    title = models.CharField('Tieu de uu dai', max_length=150, help_text='Vi du: Giam 20% to dac biet hoac Tang ly tra da')
    description = models.TextField('Chi tiet dieu kien su dung', blank=True)
    coin_cost = models.PositiveIntegerField('Gia doi (xu)', default=30)
    total_quantity = models.PositiveIntegerField('Tong so luot phat hanh', default=50)
    remaining_quantity = models.PositiveIntegerField('So luot con lai', default=50)
    expires_at = models.DateField('Han dung voucher')
    is_sample = models.BooleanField('Du lieu mau', default=True, help_text='Danh dau neu la uu dai thu nghiem chua ky ket hop tac thuc te')
    is_active = models.BooleanField('Kich hoat', default=True)

    class Meta:
        ordering = ['-id']
        verbose_name = 'voucher doi tac'
        verbose_name_plural = 'cac voucher doi tac'

    def __str__(self):
        sample_tag = ' [MAU]' if self.is_sample else ''
        return f'{self.partner_name}: {self.title} ({self.coin_cost} xu){sample_tag}'


class UserVoucherRedemption(models.Model):
    """Ma voucher dung mot lan nguoi choi da doi bang xu."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='redeemed_vouchers')
    voucher = models.ForeignKey(PartnerVoucher, on_delete=models.CASCADE, related_name='redemptions')
    redemption_code = models.CharField('Ma dung mot lan', max_length=40, unique=True)
    coin_spent = models.PositiveIntegerField('So xu da tru')
    redeemed_at_ms = models.BigIntegerField('Thoi diem doi (ms)')
    is_used = models.BooleanField('Da su dung tai quan', default=False)

    class Meta:
        ordering = ['-redeemed_at_ms']
        verbose_name = 'luot doi voucher'
        verbose_name_plural = 'lich su doi voucher'

    def __str__(self):
        return f'{self.user.username} · {self.voucher.partner_name} · {self.redemption_code}'
