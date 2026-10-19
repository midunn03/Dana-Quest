import os
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db import models, transaction

# Nhận ảnh gốc khá lớn, rồi tự thu nhỏ để bản đồ luôn nhẹ.
MAX_BYTES = 15 * 1024 * 1024   # ảnh tải lên tối đa 15 MB
MAX_SIDE = 4096                # và tối đa 4096 px mỗi cạnh
OUT_SIDE = 512                 # ảnh lưu lại sẽ được thu nhỏ về tối đa 512 px
OUT_BYTES = 300 * 1024         # và cố gắng nhẹ hơn 300 KB


def validate_sprite(file):
    """Chỉ nhận PNG/WebP thật, nhỏ gọn, để không làm nặng bản đồ."""
    from PIL import Image

    if file.size > MAX_BYTES:
        raise ValidationError('Ảnh quá nặng (tối đa 15 MB).')
    try:
        image = Image.open(file)
        image.verify()
    except Exception:
        raise ValidationError('Tệp không phải ảnh hợp lệ.')
    if image.format not in ('PNG', 'WEBP'):
        raise ValidationError('Chỉ nhận ảnh PNG hoặc WebP (nên nền trong suốt).')
    if max(image.size) > MAX_SIDE:
        raise ValidationError(f'Ảnh tối đa {MAX_SIDE}×{MAX_SIDE} pixel.')
    if not hasattr(file, 'seek'):
        return
    file.seek(0)


class Place(models.Model):
    slug = models.SlugField('Mã địa điểm', unique=True, help_text='Trùng với id trong giao diện, ví dụ: cau-rong')
    name = models.CharField('Tên', max_length=120)
    marker_meters = models.PositiveIntegerField(
        'Kích thước ngoài đời (mét)', default=70,
        help_text='Ghim rộng bằng chừng này mét trên bản đồ: càng lớn thì càng to khi zoom. Cầu Rồng nên để khoảng 160.')

    class Meta:
        verbose_name = 'địa điểm'
        verbose_name_plural = 'địa điểm'

    def __str__(self):
        return self.name


class PlaceSprite(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='sprites')
    label = models.CharField('Tên bản vẽ', max_length=60, default='Pixel 1')
    image = models.ImageField('Ảnh pixel', upload_to='places/', validators=[validate_sprite])
    is_active = models.BooleanField('Đang dùng', default=False)
    created = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['place', 'label']
        verbose_name = 'bản vẽ pixel'
        verbose_name_plural = 'bản vẽ pixel'

    def __str__(self):
        return f'{self.place.name} – {self.label}'

    def _shrink_new_upload(self):
        """Ảnh mới tải lên: thu nhỏ về tối đa 512 px, lưu PNG và nén nhẹ."""
        from PIL import Image

        upload = self.image
        if not upload or getattr(upload, '_committed', True):
            return  # không có ảnh mới
        upload.seek(0)
        img = Image.open(upload)
        img.load()
        img = img.convert('RGBA')
        img.thumbnail((OUT_SIDE, OUT_SIDE), Image.LANCZOS)
        buffer = BytesIO()
        img.save(buffer, 'PNG', optimize=True)
        if buffer.tell() > OUT_BYTES:  # còn nặng: giảm còn 256 màu
            buffer = BytesIO()
            img.quantize(256, method=Image.FASTOCTREE).save(buffer, 'PNG', optimize=True)
        name = os.path.splitext(os.path.basename(upload.name))[0][:60] + '.png'
        self.image.save(name, ContentFile(buffer.getvalue()), save=False)

    def save(self, *args, **kwargs):
        self._shrink_new_upload()
        with transaction.atomic():
            super().save(*args, **kwargs)
            if self.is_active:  # mỗi địa điểm chỉ có một bản vẽ đang dùng
                PlaceSprite.objects.filter(place=self.place).exclude(pk=self.pk).update(is_active=False)
