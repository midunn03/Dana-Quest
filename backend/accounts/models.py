from django.conf import settings
from django.db import models


class Profile(models.Model):
    """Thông tin thêm của người chơi.

    Tên đăng nhập, email và mật khẩu nằm ở bảng User có sẵn của Django.
    """

    user = models.OneToOneField(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name='profile')
    avatar_id = models.CharField('Nhân vật', max_length=64, blank=True, null=True)
    # unique + null=True: nhiều người có thể để trống, nhưng số đã nhập thì không được trùng.
    phone = models.CharField('Số điện thoại', max_length=16, unique=True, blank=True, null=True)

    def __str__(self):
        return f'Hồ sơ của {self.user.username}'
