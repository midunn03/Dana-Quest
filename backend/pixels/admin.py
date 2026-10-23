from django import forms
from django.contrib import admin
from django.utils.html import format_html

from .destinations import destination_data
from .models import Place, PlacePhoto, PlaceSprite


class PlaceForm(forms.ModelForm):
    class Meta:
        model = Place
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        self.names = {key: value['name'] for key, value in destination_data().items()}
        if self.names:  # chọn mã từ danh sách thay vì gõ tay (gõ sai mã thì ảnh sẽ không hiện trên bản đồ)
            choices = [('', '— chọn địa điểm —')] + [(key, f'{name} ({key})') for key, name in self.names.items()]
            self.fields['slug'] = forms.ChoiceField(label='Địa điểm trên bản đồ', choices=choices)
            self.fields['name'].required = False

    def clean(self):
        data = super().clean()
        if not data.get('name') and data.get('slug') in self.names:
            data['name'] = self.names[data['slug']]
        if not data.get('name'):
            self.add_error('name', 'Hãy nhập tên địa điểm.')
        return data


def thumb(obj, field='image'):
    image = getattr(obj, field, None) if obj and obj.pk else None
    if not image:
        return '—'
    return format_html('<img src="{}" style="height:64px;image-rendering:pixelated;background:#eee">', image.url)


class SpriteInline(admin.StackedInline):
    model = PlaceSprite
    extra = 0
    fieldsets = (
        (None, {'fields': ('label', 'image', 'preview', 'is_active')}),
        ('Dán xuống mặt đất (tuỳ chọn)', {
            'classes': ('collapse',),
            'description': 'Dùng cho công trình lớn như Cầu Rồng: ảnh nhìn từ trên xuống, to nhỏ đúng theo bản đồ khi phóng to. '
                           'Điền chiều rộng và chiều cao; tâm ảnh để trống thì lấy tọa độ có sẵn của địa điểm.',
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
    fields = ('image', 'preview', 'caption', 'credit', 'order')
    readonly_fields = ('preview',)

    @admin.display(description='Xem trước')
    def preview(self, obj):
        return thumb(obj)


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    form = PlaceForm
    list_display = ('name', 'slug', 'marker_meters', 'active_sprite', 'use_admin_content')
    list_filter = ('use_admin_content',)
    search_fields = ('name', 'slug')
    fieldsets = (
        (None, {'fields': ('slug', 'name', 'marker_meters')}),
        ('Nội dung trang chi tiết', {'fields': ('use_admin_content', 'highlight_reason', 'description', 'detail', 'activities',
                                                 'hours', 'hours_note', 'tip', 'address')}),
    )
    inlines = [SpriteInline, PhotoInline]

    @admin.display(description='Ảnh pixel đang dùng')
    def active_sprite(self, obj):
        sprite = obj.sprites.filter(is_active=True).first()
        if not sprite:
            return '— (chưa có)'
        return f'{sprite.label} (dán mặt đất)' if sprite.is_ground else sprite.label
