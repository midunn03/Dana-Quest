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


class GamePhoto(models.Model):
    """Ảnh nhiệm vụ của người chơi. Lưu trong cơ sở dữ liệu (riêng tư), không để ở thư mục /media công khai."""

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='game_photos')
    key = models.CharField('Mã ảnh', max_length=80, help_text='điểm-đến:nhiệm-vụ')
    destination_id = models.CharField('Địa điểm', max_length=60)
    mission_id = models.CharField('Nhiệm vụ', max_length=40)
    data = models.BinaryField('Ảnh JPEG')
    created_ms = models.BigIntegerField('Thời điểm (ms)')

    class Meta:
        constraints = [models.UniqueConstraint(fields=['user', 'key'], name='one_photo_per_mission')]
        ordering = ['created_ms']
        verbose_name = 'ảnh nhiệm vụ'
        verbose_name_plural = 'ảnh nhiệm vụ'

    def __str__(self):
        return f'{self.user.username} · {self.key}'
