from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .models import CROWD_HOURS, Place, PlacePhoto, PlaceSprite, make_slug


class PlaceForm(forms.ModelForm):
    # 18 ô nhập mức đông đúc cho 6:00 → 23:00 (0 = vắng, 100 = rất đông). Để trống hết = không hiện biểu đồ.
    for _hour in CROWD_HOURS:
        vars()[f'crowd_{_hour}'] = forms.IntegerField(label=f'{_hour}:00', required=False, min_value=0, max_value=100)
    del _hour

    class Meta:
        model = Place
        exclude = ('crowd',)

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        values = self.instance.crowd_list() if self.instance and self.instance.pk else []
        for index, hour in enumerate(CROWD_HOURS):
            if values:
                self.initial[f'crowd_{hour}'] = values[index]

    def clean(self):
        data = super().clean()
        if not data.get('slug') and data.get('name'):
            data['slug'] = make_slug(data['name'], self.instance.pk)
        levels = [data.get(f'crowd_{hour}') for hour in CROWD_HOURS]
        if any(level is not None for level in levels):
            data['crowd_values'] = [0 if level is None else level for level in levels]
        else:
            data['crowd_values'] = []
        return data

    def save(self, commit=True):
        self.instance.crowd = self.cleaned_data.get('crowd_values', [])
        return super().save(commit)


def thumb(obj, field='image'):
    image = getattr(obj, field, None) if obj and obj.pk else None
    if not image:
        return '—'
    return format_html('<img src="{}" style="height:64px;image-rendering:pixelated;background:#eee">', image.url)


class SpriteInline(admin.StackedInline):
    model = PlaceSprite
    extra = 0
    verbose_name = 'bản vẽ pixel'
    verbose_name_plural = 'Bản vẽ pixel (ảnh trên bản đồ)'
    fieldsets = (
        (None, {'fields': ('label', 'image', 'preview', 'is_active')}),
        ('Dán xuống mặt đất (tuỳ chọn)', {
            'classes': ('collapse',),
            'description': 'Dùng cho công trình lớn như Cầu Rồng: ảnh nhìn từ trên xuống, to nhỏ đúng theo bản đồ khi phóng to. '
                           'Điền chiều rộng và chiều cao; tâm ảnh để trống thì lấy tọa độ của địa điểm.',
            'fields': ('ground_width_m', 'ground_height_m', 'ground_lat', 'ground_lng', 'ground_rotation'),
        }),
    )
    readonly_fields = ('preview',)

    @admin.display(description='Xem trước')
    def preview(self, obj):
        return thumb(obj)


class PhotoInline(admin.TabularInline):
    model = PlacePhoto
    extra = 0
    verbose_name = 'ảnh minh họa'
    verbose_name_plural = 'Ảnh minh họa trong trang chi tiết (ảnh số nhỏ nhất hiện đầu tiên)'
    fields = ('image', 'preview', 'caption', 'credit', 'order')
    readonly_fields = ('preview',)

    @admin.display(description='Xem trước')
    def preview(self, obj):
        return thumb(obj)


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    form = PlaceForm
    list_display = ('name', 'slug', 'category', 'is_active', 'has_position', 'photo_count', 'active_sprite')
    list_filter = ('is_active', 'category')
    list_editable = ('is_active',)
    search_fields = ('name', 'slug', 'tags')
    fieldsets = (
        ('Thông tin chung', {'fields': ('is_active', 'name', 'slug', 'category', 'area', 'tags', 'featured_score')}),
        ('Vị trí trên bản đồ', {'fields': ('latitude', 'longitude', 'marker_meters')}),
        ('Giới thiệu (hiện trong trang địa điểm)', {'fields': ('highlight_reason', 'description', 'detail', 'activities', 'tip', 'address')}),
        ('Giờ mở cửa', {'fields': ('hours', 'hours_note')}),
        ('Giờ đông đúc', {
            'classes': ('collapse',),
            'description': 'Nhập mức đông theo từng giờ, từ 0 (vắng) đến 100 (rất đông). Để trống tất cả thì ứng dụng không hiện biểu đồ.',
            'fields': ('crowd_note',) + tuple(f'crowd_{hour}' for hour in CROWD_HOURS),
        }),
    )
    inlines = [PhotoInline, SpriteInline]

    @admin.display(boolean=True, description='Có tọa độ')
    def has_position(self, obj):
        return obj.position() is not None

    @admin.display(description='Số ảnh')
    def photo_count(self, obj):
        return obj.photos.count()

    @admin.display(description='Ảnh pixel đang dùng')
    def active_sprite(self, obj):
        sprite = obj.sprites.filter(is_active=True).first()
        if not sprite:
            return '— (chưa có)'
        return f'{sprite.label} (dán mặt đất)' if sprite.is_ground else sprite.label
