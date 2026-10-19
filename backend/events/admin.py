from django import forms
from django.contrib import admin

from .models import WEEKDAYS, Event


class EventForm(forms.ModelForm):
    weekdays = forms.MultipleChoiceField(
        label='Lặp vào các thứ', required=False, choices=WEEKDAYS, widget=forms.CheckboxSelectMultiple,
        help_text=Event._meta.get_field('weekdays').help_text)

    class Meta:
        model = Event
        fields = '__all__'

    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)
        if self.instance and self.instance.pk:
            self.initial['weekdays'] = [str(d) for d in sorted(self.instance.weekday_set())]

    def clean_weekdays(self):
        return ','.join(sorted(self.cleaned_data['weekdays']))

    def clean(self):
        data = super().clean()
        if data.get('start_date') and data.get('end_date') and data['end_date'] < data['start_date']:
            self.add_error('end_date', 'Ngày kết thúc phải sau ngày bắt đầu.')
        return data


@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    form = EventForm
    list_display = ('title', 'place', 'when', 'start_time', 'end_time', 'is_active')
    list_filter = ('is_active', 'kind', 'place')
    list_editable = ('is_active',)
    search_fields = ('title', 'description')

    @admin.display(description='Lặp')
    def when(self, obj):
        names = dict(WEEKDAYS)
        days = sorted(obj.weekday_set())
        return ', '.join(names[d] for d in days) if days else 'Mọi ngày'
