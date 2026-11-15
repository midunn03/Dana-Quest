import base64

from django.contrib import admin
from django.utils.html import format_html

from .models import GamePhoto, GameState, GameStateBackup, QuestActivationCode, QuestRunState, StreakMilestone, BadgeTheme, Badge, GoldenHourChallenge, PartnerVoucher, UserVoucherRedemption, PlayerGroup, GroupMembership, FriendInvite, CoCheckinRecord


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


@admin.register(StreakMilestone)
class StreakMilestoneAdmin(admin.ModelAdmin):
    list_display = ('days', 'bonus_coins', 'bonus_xp', 'message', 'is_active')
    list_editable = ('bonus_coins', 'bonus_xp', 'is_active')
    ordering = ('days',)


class BadgeInline(admin.TabularInline):
    model = Badge
    extra = 1
    fields = ('badge_id', 'title', 'rarity', 'required_destinations', 'bonus_coins', 'is_active', 'order')


@admin.register(BadgeTheme)
class BadgeThemeAdmin(admin.ModelAdmin):
    list_display = ('name', 'slug', 'icon', 'badge_count', 'completion_bonus_coins', 'order')
    search_fields = ('name', 'slug')
    inlines = [BadgeInline]

    @admin.display(description='Số huy hiệu')
    def badge_count(self, obj):
        return obj.badges.count()


@admin.register(Badge)
class BadgeAdmin(admin.ModelAdmin):
    list_display = ('title', 'badge_id', 'theme', 'rarity', 'bonus_coins', 'bonus_xp', 'is_active', 'order')
    list_filter = ('theme', 'rarity', 'is_active')
    search_fields = ('title', 'badge_id', 'description')
    list_editable = ('rarity', 'bonus_coins', 'is_active', 'order')


@admin.register(GoldenHourChallenge)
class GoldenHourChallengeAdmin(admin.ModelAdmin):
    list_display = ('title', 'destination_id', 'start_time', 'end_time', 'bonus_coins', 'multiplier', 'is_active')
    list_filter = ('destination_id', 'is_active')
    search_fields = ('title', 'destination_id', 'description')
    list_editable = ('bonus_coins', 'multiplier', 'is_active')


@admin.register(PartnerVoucher)
class PartnerVoucherAdmin(admin.ModelAdmin):
    list_display = ('title', 'partner_name', 'destination_id', 'coin_cost', 'remaining_quantity', 'total_quantity', 'expires_at', 'is_sample', 'is_active')
    list_filter = ('is_sample', 'is_active', 'destination_id')
    search_fields = ('title', 'partner_name', 'destination_id')
    list_editable = ('coin_cost', 'remaining_quantity', 'is_active')


@admin.register(UserVoucherRedemption)
class UserVoucherRedemptionAdmin(admin.ModelAdmin):
    list_display = ('user', 'voucher', 'redemption_code', 'coin_spent', 'is_used')
    list_filter = ('is_used', 'voucher')
    search_fields = ('user__username', 'redemption_code', 'voucher__partner_name')
    readonly_fields = ('user', 'voucher', 'redemption_code', 'coin_spent', 'redeemed_at_ms')


class GroupMembershipInline(admin.TabularInline):
    model = GroupMembership
    extra = 0
    readonly_fields = ('user', 'joined_at')


@admin.register(PlayerGroup)
class PlayerGroupAdmin(admin.ModelAdmin):
    list_display = ('name', 'code', 'leader', 'member_count', 'created_at')
    search_fields = ('name', 'code', 'leader__username')
    inlines = [GroupMembershipInline]

    @admin.display(description='Số thành viên')
    def member_count(self, obj):
        return obj.memberships.count()


@admin.register(GroupMembership)
class GroupMembershipAdmin(admin.ModelAdmin):
    list_display = ('user', 'group', 'opt_in_leaderboard', 'joined_at')
    list_filter = ('opt_in_leaderboard', 'group')
    search_fields = ('user__username', 'group__name')


@admin.register(FriendInvite)
class FriendInviteAdmin(admin.ModelAdmin):
    list_display = ('sender', 'invite_code', 'friend', 'created_at')
    search_fields = ('sender__username', 'invite_code', 'friend__username')


@admin.register(CoCheckinRecord)
class CoCheckinRecordAdmin(admin.ModelAdmin):
    list_display = ('group', 'destination_id', 'date_key', 'bonus_coins', 'created_at')
    list_filter = ('date_key', 'destination_id')
    search_fields = ('group__name', 'destination_id')
