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
