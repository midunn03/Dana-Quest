import base64

from django.contrib import admin
from django.utils.html import format_html

from .models import GamePhoto, GameState, GameStateBackup, QuestActivationCode, QuestRunState


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
    list_display = ('user', 'destination_id', 'mission_id', 'quarantined', 'thumb')
    list_filter = ('destination_id', 'quarantined')
    readonly_fields = ('user', 'key', 'destination_id', 'mission_id', 'created_ms', 'quarantined', 'thumb')
    exclude = ('data',)

    @admin.display(description='Ảnh')
    def thumb(self, obj):
        if not obj.pk:
            return '—'
        return format_html('<img src="data:image/jpeg;base64,{}" style="height:90px">', base64.b64encode(bytes(obj.data)).decode())

    def has_add_permission(self, request):
        return False


class SnapshotAdmin(admin.ModelAdmin):
    """View runtime-owned records without bypassing API progression guards."""
    def get_readonly_fields(self, request, obj=None):
        return tuple(field.name for field in self.model._meta.fields)

    def has_add_permission(self, request):
        return False

    def has_change_permission(self, request, obj=None):
        return False

    def has_delete_permission(self, request, obj=None):
        return False


@admin.register(QuestRunState)
class QuestRunStateAdmin(SnapshotAdmin):
    list_display = ('user', 'updated')
    search_fields = ('user__username',)


@admin.register(GameStateBackup)
class GameStateBackupAdmin(SnapshotAdmin):
    list_display = ('user', 'revision', 'created')
    search_fields = ('user__username',)


@admin.register(QuestActivationCode)
class QuestActivationCodeAdmin(SnapshotAdmin):
    list_display = ('quest_id', 'user', 'expires_at', 'redeemed_at', 'revoked')
    list_filter = ('revoked',)
    search_fields = ('quest_id', 'user__username')
