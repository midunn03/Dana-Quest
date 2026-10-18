from django.contrib import admin
from django.utils.html import format_html

from .models import Place, PlaceSprite


class SpriteInline(admin.TabularInline):
    model = PlaceSprite
    extra = 1
    fields = ('label', 'image', 'preview', 'is_active')
    readonly_fields = ('preview',)

    @admin.display(description='Xem trước')
    def preview(self, obj):
        if not obj.pk or not obj.image:
            return '—'
        return format_html('<img src="{}" style="height:64px;image-rendering:pixelated;background:#eee">', obj.image.url)


@admin.register(Place)
class PlaceAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'marker_meters', 'active_sprite')
    search_fields = ('name', 'slug')
    inlines = [SpriteInline]

    @admin.display(description='Đang dùng')
    def active_sprite(self, obj):
        sprite = obj.sprites.filter(is_active=True).first()
        return sprite.label if sprite else '— (dùng ảnh mặc định)'
