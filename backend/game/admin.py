import base64

from django.contrib import admin
from django.utils.html import format_html

from .models import GamePhoto, GameState


@admin.register(GameState)
class GameStateAdmin(admin.ModelAdmin):
    list_display = ('user', 'revision', 'places_started', 'missions_done', 'updated')
    readonly_fields = ('user', 'revision', 'state', 'updated')
    search_fields = ('user__username',)

    @admin.display(description='Điểm đã bắt đầu')
    def places_started(self, obj):
        return len((obj.state or {}).get('destinations', {}))

    @admin.display(description='Nhiệm vụ xong')
    def missions_done(self, obj):
        return sum(len(p.get('completed', [])) for p in (obj.state or {}).get('destinations', {}).values())

    def has_add_permission(self, request):
        return False


@admin.register(GamePhoto)
class GamePhotoAdmin(admin.ModelAdmin):
    list_display = ('user', 'destination_id', 'mission_id', 'thumb')
    list_filter = ('destination_id',)
    readonly_fields = ('user', 'key', 'destination_id', 'mission_id', 'created_ms', 'thumb')
    exclude = ('data',)

    @admin.display(description='Ảnh')
    def thumb(self, obj):
        if not obj.pk:
            return '—'
        return format_html('<img src="data:image/jpeg;base64,{}" style="height:90px">', base64.b64encode(bytes(obj.data)).decode())

    def has_add_permission(self, request):
        return False
