import os
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db import models, transaction

# Nhận ảnh gốc khá lớn, rồi tự thu nhỏ để trang luôn nhẹ.
MAX_BYTES = 15 * 1024 * 1024   # ảnh tải lên tối đa 15 MB
MAX_SIDE = 4096                # và tối đa 4096 px mỗi cạnh
PIN_SIDE = 512                 # ảnh ghim: thu nhỏ về tối đa 512 px
PIN_BYTES = 300 * 1024
GROUND_SIDE = 2048             # ảnh dán xuống mặt đất cần nét hơn: tối đa 2048 px
GROUND_BYTES = 1200 * 1024
PHOTO_SIDE = 1600              # ảnh minh họa trong trang chi tiết: tối đa 1600 px
PHOTO_BYTES = 600 * 1024


def validate_image(file, formats=('PNG', 'WEBP')):
    from PIL import Image

    if file.size > MAX_BYTES:
        raise ValidationError('Ảnh quá nặng (tối đa 15 MB).')
    try:
        image = Image.open(file)
        image.verify()
    except Exception:
        raise ValidationError('Tệp không phải ảnh hợp lệ.')
    if image.format not in formats:
        raise ValidationError('Định dạng ảnh không được hỗ trợ. Hãy dùng: ' + ', '.join(formats) + '.')
    if max(image.size) > MAX_SIDE:
        raise ValidationError(f'Ảnh tối đa {MAX_SIDE}×{MAX_SIDE} pixel.')
    if hasattr(file, 'seek'):
        file.seek(0)


def validate_sprite(file):
    validate_image(file, ('PNG', 'WEBP'))


def validate_photo(file):
    validate_image(file, ('PNG', 'WEBP', 'JPEG'))


def shrink_upload(field_file, side, max_bytes, keep_alpha=True):
    """Thu nhỏ ảnh vừa tải lên rồi lưu lại. Trả về True nếu đã xử lý."""
    from PIL import Image

    if not field_file or getattr(field_file, '_committed', True):
        return False
    field_file.seek(0)
    img = Image.open(field_file)
    img.load()
    has_alpha = keep_alpha and (img.mode in ('RGBA', 'LA') or 'transparency' in img.info)
    img = img.convert('RGBA' if has_alpha else 'RGB')
    img.thumbnail((side, side), Image.LANCZOS)
    buffer = BytesIO()
    if has_alpha:
        img.save(buffer, 'PNG', optimize=True)
        if buffer.tell() > max_bytes:  # còn nặng: giảm còn 256 màu
            buffer = BytesIO()
            img.quantize(256, method=Image.FASTOCTREE).save(buffer, 'PNG', optimize=True)
        ext = '.png'
    else:
        img.save(buffer, 'JPEG', quality=86, optimize=True)
        ext = '.jpg'
    name = os.path.splitext(os.path.basename(field_file.name))[0][:60] + ext
    field_file.save(name, ContentFile(buffer.getvalue()), save=False)
    return True


class Place(models.Model):
    slug = models.SlugField('Mã địa điểm', unique=True, help_text='Trùng với id trong giao diện, ví dụ: cau-rong')
    name = models.CharField('Tên', max_length=120)
    marker_meters = models.PositiveIntegerField(
        'Kích thước ghim ngoài đời (mét)', default=200,
        help_text='Ghim rộng bằng chừng này mét trên bản đồ: càng lớn thì ghim càng to. Gợi ý: 200 cho địa điểm thường, 320 cho Cầu Rồng. Không áp dụng cho ảnh dán xuống mặt đất (xem phần Bản vẽ pixel).')

    # Nội dung trang chi tiết do admin tự viết
    use_admin_content = models.BooleanField(
        'Dùng nội dung do admin viết', default=False,
        help_text='Bật: trang chi tiết chỉ hiện nội dung bên dưới (ô trống thì ẩn mục đó, không dùng lại nội dung mặc định). Tắt: dùng nội dung mặc định của ứng dụng.')
    description = models.TextField('Giới thiệu ngắn', blank=True)
    detail = models.TextField('Chi tiết', blank=True)
    highlight_reason = models.CharField('Lý do nổi bật (một dòng)', max_length=140, blank=True)
    activities = models.TextField('Gợi ý hoạt động', blank=True, help_text='Mỗi dòng là một hoạt động.')
    hours = models.CharField('Giờ mở cửa', max_length=120, blank=True)
    hours_note = models.TextField('Ghi chú về giờ mở cửa', blank=True)
    tip = models.TextField('Mẹo nhỏ', blank=True)
    address = models.CharField('Địa chỉ', max_length=200, blank=True)

    class Meta:
        verbose_name = 'địa điểm'
        verbose_name_plural = 'địa điểm'

    def __str__(self):
        return self.name

    def activity_list(self):
        return [line.strip() for line in self.activities.splitlines() if line.strip()]


class PlaceSprite(models.Model):
    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='sprites')
    label = models.CharField('Tên bản vẽ', max_length=60, default='Pixel 1')
    image = models.ImageField('Ảnh pixel', upload_to='places/', validators=[validate_sprite])
    is_active = models.BooleanField('Đang dùng', default=False)
    created = models.DateTimeField(auto_now_add=True)

    # Dán xuống mặt đất: ảnh nhìn từ trên xuống, phóng to thu nhỏ đúng theo bản đồ.
    ground_width_m = models.PositiveIntegerField(
        'Chiều rộng ngoài đời (mét)', null=True, blank=True,
        help_text='Điền chiều rộng và chiều cao để ảnh được dán xuống mặt đất. Để trống thì ảnh dùng làm ghim như thường.')
    ground_height_m = models.PositiveIntegerField('Chiều cao ngoài đời (mét)', null=True, blank=True)
    ground_lat = models.FloatField('Vĩ độ tâm ảnh', null=True, blank=True, help_text='Để trống = lấy tọa độ có sẵn của địa điểm.')
    ground_lng = models.FloatField('Kinh độ tâm ảnh', null=True, blank=True)
    ground_rotation = models.FloatField('Góc xoay (độ, theo chiều kim đồng hồ)', default=0)

    class Meta:
        ordering = ['place', 'label']
        verbose_name = 'bản vẽ pixel'
        verbose_name_plural = 'bản vẽ pixel'

    def __str__(self):
        return f'{self.place.name} – {self.label}'

    @property
    def is_ground(self):
        return bool(self.ground_width_m and self.ground_height_m)

    def clean(self):
        super().clean()
        if bool(self.ground_width_m) != bool(self.ground_height_m):
            raise ValidationError('Hãy điền cả chiều rộng và chiều cao (mét), hoặc để trống cả hai.')
        if (self.ground_lat is None) != (self.ground_lng is None):
            raise ValidationError('Hãy điền cả vĩ độ và kinh độ, hoặc để trống cả hai.')
        if self.ground_lat is not None and not (-90 <= self.ground_lat <= 90 and -180 <= self.ground_lng <= 180):
            raise ValidationError('Tọa độ không hợp lệ.')

    def save(self, *args, **kwargs):
        if self.is_ground:
            shrink_upload(self.image, GROUND_SIDE, GROUND_BYTES)
        else:
            shrink_upload(self.image, PIN_SIDE, PIN_BYTES)
        with transaction.atomic():
            super().save(*args, **kwargs)
            if self.is_active:  # mỗi địa điểm chỉ có một bản vẽ đang dùng
                PlaceSprite.objects.filter(place=self.place).exclude(pk=self.pk).update(is_active=False)


class PlacePhoto(models.Model):
    """Ảnh minh họa trong trang chi tiết (hiện theo thứ tự)."""

    place = models.ForeignKey(Place, on_delete=models.CASCADE, related_name='photos')
    image = models.ImageField('Ảnh', upload_to='place-photos/', validators=[validate_photo])
    caption = models.CharField('Chú thích', max_length=160, blank=True)
    credit = models.CharField('Nguồn / tác giả', max_length=160, blank=True)
    order = models.PositiveIntegerField('Thứ tự', default=0)

    class Meta:
        ordering = ['place', 'order', 'id']
        verbose_name = 'ảnh minh họa'
        verbose_name_plural = 'ảnh minh họa'

    def __str__(self):
        return f'{self.place.name} – ảnh {self.order}'

    def save(self, *args, **kwargs):
        shrink_upload(self.image, PHOTO_SIDE, PHOTO_BYTES)
        super().save(*args, **kwargs)
