from datetime import date, datetime, timedelta
from zoneinfo import ZoneInfo

from django.db import models

VN_TZ = ZoneInfo('Asia/Ho_Chi_Minh')
WEEKDAYS = [(0, 'Thứ 2'), (1, 'Thứ 3'), (2, 'Thứ 4'), (3, 'Thứ 5'), (4, 'Thứ 6'), (5, 'Thứ 7'), (6, 'Chủ nhật')]


class Event(models.Model):
    """Một sự kiện (có thể lặp hàng tuần) gắn với một địa điểm."""

    KINDS = [('show', 'Biểu diễn / trình diễn'), ('festival', 'Lễ hội'), ('market', 'Chợ / hội chợ'), ('other', 'Khác')]

    title = models.CharField('Tên sự kiện', max_length=140)
    description = models.TextField('Mô tả ngắn', blank=True)
    kind = models.CharField('Loại', max_length=12, choices=KINDS, default='show')
    place = models.ForeignKey('pixels.Place', verbose_name='Địa điểm', null=True, blank=True,
                              on_delete=models.SET_NULL, related_name='events')
    weekdays = models.CharField(
        'Lặp vào các thứ', max_length=20, blank=True,
        help_text='Để trống = diễn ra mọi ngày trong khoảng ngày bên dưới. Ví dụ chọn Thứ 7 + Chủ nhật.')
    start_date = models.DateField('Từ ngày', null=True, blank=True, help_text='Để trống = không giới hạn.')
    end_date = models.DateField('Đến ngày', null=True, blank=True, help_text='Để trống = không giới hạn. Sự kiện một ngày: nhập cùng ngày ở cả hai ô.')
    start_time = models.TimeField('Giờ bắt đầu')
    end_time = models.TimeField('Giờ kết thúc')
    is_active = models.BooleanField('Đang bật', default=True)

    class Meta:
        ordering = ['start_time', 'title']
        verbose_name = 'sự kiện'
        verbose_name_plural = 'sự kiện'

    def __str__(self):
        return self.title

    def weekday_set(self):
        return {int(x) for x in self.weekdays.split(',') if x.strip().isdigit()}

    def occurs_on(self, day: date) -> bool:
        if not self.is_active:
            return False
        if self.start_date and day < self.start_date:
            return False
        if self.end_date and day > self.end_date:
            return False
        days = self.weekday_set()
        return not days or day.weekday() in days

    def occurrences(self, first: date, last: date):
        """Các lần diễn ra (start, end) theo giờ Việt Nam trong [first, last]."""
        day = first
        while day <= last:
            if self.occurs_on(day):
                start = datetime.combine(day, self.start_time, tzinfo=VN_TZ)
                end = datetime.combine(day, self.end_time, tzinfo=VN_TZ)
                if end <= start:  # qua nửa đêm
                    end += timedelta(days=1)
                yield start, end
            day += timedelta(days=1)
