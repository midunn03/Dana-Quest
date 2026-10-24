import os
from io import BytesIO

from django.core.exceptions import ValidationError
from django.core.files.base import ContentFile
from django.db import models, transaction
from django.utils.text import slugify

from .destinations import destination_data

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


CATEGORIES = [
    ('landmark', 'Kiến trúc / biểu tượng'), ('museum', 'Bảo tàng'), ('park', 'Công viên'), ('beach', 'Biển'),
    ('pagoda', 'Chùa'), ('nature', 'Thiên nhiên'), ('heritage', 'Di tích'),
]
CROWD_HOURS = list(range(6, 24))  # biểu đồ giờ đông đúc: 6:00 → 23:00


def make_slug(name, exclude_pk=None):
    """Mã địa điểm không dấu, không trùng (vd: 'Chợ Cồn' -> 'cho-con')."""
    base = slugify((name or '').replace('đ', 'd').replace('Đ', 'D')) or 'dia-diem'
    slug, number = base, 2
    queryset = Place.objects.exclude(pk=exclude_pk) if exclude_pk else Place.objects.all()
    while queryset.filter(slug=slug).exists():
        slug = f'{base}-{number}'
        number += 1
    return slug


class Place(models.Model):
    """Một địa điểm trên bản đồ. Mọi thứ hiển thị trong ứng dụng (vị trí, giới thiệu, ảnh...) đều chỉnh ở đây."""

    is_active = models.BooleanField('Hiện trên bản đồ', default=True, help_text='Bỏ tick để ẩn tạm thời mà không xóa.')
    slug = models.SlugField('Mã địa điểm', unique=True, blank=True, help_text='Để trống để tự tạo từ tên. Đừng đổi mã sau khi đã có người chơi, vì tiến độ nhiệm vụ gắn với mã này.')
    name = models.CharField('Tên', max_length=120)
    category = models.CharField('Loại', max_length=12, choices=CATEGORIES, default='landmark')
    latitude = models.FloatField('Vĩ độ', null=True, blank=True, help_text='Mở Google Maps, bấm phải vào đúng vị trí, bấm vào hai con số đầu tiên để chép (ví dụ 16.0611, 108.2277).')
    longitude = models.FloatField('Kinh độ', null=True, blank=True)
    area = models.CharField('Khu vực', max_length=200, blank=True, help_text='Ví dụ: Hải Châu, Đà Nẵng.')
    tags = models.CharField('Từ khóa tìm kiếm', max_length=200, blank=True, help_text='Cách nhau bằng dấu phẩy, ví dụ: cầu, kiến trúc, sông Hàn.')
    featured_score = models.PositiveIntegerField('Độ nổi bật (0–100)', default=50, help_text='Địa điểm điểm cao được ưu tiên khi gợi ý quanh bạn.')
    marker_meters = models.PositiveIntegerField(
        'Kích thước ghim ngoài đời (mét)', default=200,
        help_text='Ghim rộng bằng chừng này mét trên bản đồ: càng lớn thì ghim càng to. Gợi ý: 200 cho địa điểm thường, 320 cho Cầu Rồng. Không áp dụng cho ảnh dán xuống mặt đất (xem phần Bản vẽ pixel).')

    # Nội dung trang chi tiết
    highlight_reason = models.CharField('Lý do nổi bật (một dòng)', max_length=140, blank=True)
    description = models.TextField('Tổng quan (đoạn 1)', blank=True)
    detail = models.TextField('Tổng quan (đoạn 2 / chi tiết)', blank=True)
    activities = models.TextField('Gợi ý hoạt động', blank=True, help_text='Mỗi dòng là một hoạt động.')
    hours = models.CharField('Giờ mở cửa', max_length=120, blank=True, help_text='Ví dụ: 08:00 – 17:00, các ngày trong tuần.')
    hours_note = models.TextField('Ghi chú về giờ mở cửa', blank=True)
    tip = models.TextField('Mẹo nhỏ', blank=True)
    address = models.CharField('Địa chỉ', max_length=200, blank=True)
    crowd = models.JSONField('Giờ đông đúc', default=list, blank=True)
    crowd_note = models.CharField('Ghi chú giờ đông đúc', max_length=200, blank=True, help_text='Ví dụ: Đông nhất vào buổi tối cuối tuần.')

    class Meta:
        ordering = ['name']
        verbose_name = 'địa điểm'
        verbose_name_plural = 'địa điểm'

    def __str__(self):
        return self.name

    def activity_list(self):
        return [line.strip() for line in self.activities.splitlines() if line.strip()]

    def tag_list(self):
        return [tag.strip() for tag in self.tags.split(',') if tag.strip()]

    def crowd_list(self):
        """18 mức (0–100) cho 6:00 → 23:00; không có dữ liệu thì rỗng."""
        values = self.crowd if isinstance(self.crowd, list) else []
        if len(values) != len(CROWD_HOURS) or not any(isinstance(v, (int, float)) for v in values):
            return []
        return [max(0, min(100, int(v))) if isinstance(v, (int, float)) and not isinstance(v, bool) else 0 for v in values]

    def position(self):
        """(vĩ độ, kinh độ); nếu chưa nhập thì lấy tọa độ có sẵn của địa điểm mẫu cùng mã."""
        if self.latitude is not None and self.longitude is not None:
            return (self.latitude, self.longitude)
        builtin = destination_data().get(self.slug)
        return tuple(builtin['position']) if builtin else None

    def clean(self):
        super().clean()
        if (self.latitude is None) != (self.longitude is None):
            raise ValidationError('Hãy nhập cả vĩ độ và kinh độ.')
        if self.latitude is not None and not (-90 <= self.latitude <= 90 and -180 <= self.longitude <= 180):
            raise ValidationError('Tọa độ không hợp lệ.')
        if self.latitude is None and self.slug not in destination_data():
            raise ValidationError('Hãy nhập vĩ độ và kinh độ để địa điểm hiện lên bản đồ.')

    def save(self, *args, **kwargs):
        if not self.slug:
            self.slug = make_slug(self.name, self.pk)
        super().save(*args, **kwargs)


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
