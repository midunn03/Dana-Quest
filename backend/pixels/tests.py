from django.core.exceptions import ValidationError
from django.core.management import call_command
from django.test import TestCase

from pixels.models import TransitStation


class TransitStationTests(TestCase):
    def test_transit_station_validation(self):
        station = TransitStation(
            station_id='test-station',
            name='Trạm thử nghiệm',
            transit_type='bike',
            latitude=16.05,
            longitude=108.22,
        )
        station.full_clean()
        station.save()
        self.assertEqual(str(station), 'Trạm thử nghiệm [Xe đạp công cộng (Bike)] (Chưa xác minh)')

        bad_lat = TransitStation(
            station_id='bad-lat',
            name='Lỗi vĩ độ',
            latitude=95.0,
            longitude=108.22,
        )
        with self.assertRaises(ValidationError):
            bad_lat.full_clean()

    def test_seed_transit_command(self):
        call_command('seed_transit')
        self.assertEqual(TransitStation.objects.count(), 13)
        self.assertEqual(TransitStation.objects.filter(verified=True).count(), 0)

        call_command('seed_transit', '--verify-confirmed')
        self.assertEqual(TransitStation.objects.filter(verified=True).count(), 10)

    def test_transit_stations_api_filters_verified_and_active(self):
        TransitStation.objects.create(
            station_id='v-active',
            name='Trạm hiển thị',
            transit_type='bike',
            latitude=16.06,
            longitude=108.22,
            verified=True,
            is_active=True,
            bonus_coins=5,
        )
        TransitStation.objects.create(
            station_id='unverified',
            name='Trạm chưa xác minh',
            transit_type='bike',
            latitude=16.07,
            longitude=108.23,
            verified=False,
            is_active=True,
        )
        TransitStation.objects.create(
            station_id='inactive',
            name='Trạm tạm đóng',
            transit_type='bus',
            latitude=16.08,
            longitude=108.24,
            verified=True,
            is_active=False,
        )

        response = self.client.get('/api/pixel/transit/stations')
        self.assertEqual(response.status_code, 200)
        data = response.json()
        ids = [item['id'] for item in data['stations']]
        self.assertIn('v-active', ids)
        self.assertNotIn('unverified', ids)
        self.assertNotIn('inactive', ids)
