import copy
import json
from pathlib import Path
from unittest.mock import patch

from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.db import DatabaseError, connection
from django.test import TestCase

from . import rules
from .models import GamePhoto, GameState

OWNER_CHANGED = 'Tài khoản đã thay đổi ở tab khác. Hãy tải lại trang.'


def valid_state():
    return {'version':1, 'destinations':{'cau-rong':{'started':True,'selected':['arrival','read','observe','walk','respect'],'completed':['read'],'startedAt':1000,'completedAt':{'read':1100}}}, 'redemptions':[]}


class GameIntegrityTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.alice = get_user_model().objects.create_user(username='game-a')
        cls.bob = get_user_model().objects.create_user(username='game-b')

    def setUp(self):
        self.client.force_login(self.bob)
        self.row = GameState.objects.create(user=self.bob, revision=3, state=valid_state())
        self.photo = GamePhoto.objects.create(user=self.bob, key='cau-rong:overview-photo', destination_id='cau-rong', mission_id='overview-photo', data=b'\xff\xd8\xffsynthetic', created_ms=1000)

    def post(self, data, owner=None):
        return self.client.post('/api/auth/game', json.dumps(data), content_type='application/json', HTTP_X_DANA_USER=str(self.bob.pk) if owner is None else owner)

    def test_runner_uses_memory_database_only(self):
        name = str(connection.settings_dict['NAME'])
        self.assertTrue(name == ':memory:' or ('mode=memory' in name))

    def test_reads_and_writes_reject_missing_or_mismatched_tab_owner(self):
        for headers in ({}, {'HTTP_X_DANA_USER':str(self.alice.pk)}):
            for method, data in [('get', None), ('post', {'revision':3,'kind':'action','action':{'type':'complete','destinationId':'cau-rong','missionId':'observe'}})]:
                with self.subTest(method=method, supplied=bool(headers)):
                    response = self.client.get('/api/auth/game?photos=full', **headers) if method=='get' else self.client.post('/api/auth/game', json.dumps(data), content_type='application/json', **headers)
                    self.assertEqual(response.status_code, 409)
                    self.assertEqual(response.json()['message'], OWNER_CHANGED)
        self.row.refresh_from_db()
        self.assertEqual(self.row.state, valid_state())
        self.assertEqual(self.row.revision, 3)

    def test_owner_check_also_precedes_photo_delete_upload_and_reset(self):
        for data in ({'kind':'reset'}, {'kind':'delete-photo','revision':3,'photoId':self.photo.key}, {'kind':'photo','revision':3,'photo':{}}):
            response = self.post(data, str(self.alice.pk))
            self.assertEqual(response.status_code, 409)
        self.assertTrue(GamePhoto.objects.filter(pk=self.photo.pk).exists())

    def test_valid_owner_reads_full_photo_and_updates_progress(self):
        response = self.client.get('/api/auth/game?photos=full', HTTP_X_DANA_USER=str(self.bob.pk))
        self.assertEqual(response.status_code, 200)
        self.assertIn('data', response.json()['photos'][0])
        response = self.post({'kind':'action','revision':3,'action':{'type':'complete','destinationId':'cau-rong','missionId':'observe'}})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['state']['destinations']['cau-rong']['completed'], ['read','observe'])

    def test_nested_mission_and_voucher_corruption_is_rejected(self):
        cases = []
        for field, value in [('started','yes'),('selected',['read']*5),('selected',[{}]),('completed',['missing']),('completed',['read','read']),('completedAt',[]),('completedAt',{'missing':1000}),('completedAt',{'read':True}),('startedAt',True)]:
            bad = valid_state();bad['destinations']['cau-rong'][field]=value;cases.append(bad)
        for values in ([{}], [{'rewardId':'missing','redeemedAt':1000}], [{'rewardId':'postcard','redeemedAt':'bad'}], [{'rewardId':'postcard','redeemedAt':1000}], [{'rewardId':['postcard'],'redeemedAt':1000}]):
            bad = valid_state();bad['redemptions']=values;cases.append(bad)
        bad=valid_state();bad['version']=True;cases.append(bad)
        for number, state in enumerate(cases):
            with self.subTest(case=number): self.assertFalse(rules.is_healthy(state))

    def test_valid_legacy_timestamps_are_optional_and_vouchers_cannot_be_duplicated(self):
        state=valid_state();progress=state['destinations']['cau-rong'];progress.pop('startedAt');progress.pop('completedAt')
        self.assertTrue(rules.is_healthy(state))
        progress['completed']=['read','observe','walk'];state['redemptions']=[{'rewardId':'postcard','redeemedAt':1000}]
        self.assertTrue(rules.is_healthy(state))
        state['redemptions'].append({'rewardId':'postcard','redeemedAt':1001})
        self.assertFalse(rules.is_healthy(state))

    def test_historical_destinations_remain_valid_without_rewriting_progress(self):
        catalog = Path(settings.BASE_DIR).parent / 'src' / 'data' / 'historicalDestinations.json'
        historical = json.loads(catalog.read_text(encoding='utf-8'))
        self.assertTrue(historical)
        state = valid_state()
        progress = state['destinations'].pop('cau-rong')
        state['destinations'][historical[0]['id']] = progress
        self.assertTrue(rules.is_healthy(state))

    def test_corrupt_reads_and_actions_do_not_overwrite_saved_state(self):
        original={'version':1,'destinations':{'cau-rong':{'started':True,'selected':'broken','completed':[]}},'redemptions':[]}
        self.row.state=original;self.row.save()
        self.assertEqual(self.client.get('/api/auth/game', HTTP_X_DANA_USER=str(self.bob.pk)).status_code, 422)
        self.assertEqual(self.post({'kind':'delete-photo','revision':3,'photoId':self.photo.key}).status_code, 422)
        self.row.refresh_from_db();self.assertEqual(self.row.state, original)
        self.assertTrue(GamePhoto.objects.filter(pk=self.photo.pk).exists())

    def test_reset_saves_original_json_and_revision_and_keeps_photos(self):
        original={'version':1,'destinations':{'cau-rong':{'started':True,'selected':'broken','completed':[]}},'redemptions':[]}
        self.row.state=copy.deepcopy(original);self.row.save()
        response=self.post({'kind':'reset'})
        self.assertEqual(response.status_code, 200)
        backup=apps.get_model('game','GameStateBackup').objects.get(user=self.bob)
        self.assertEqual(backup.state, original);self.assertEqual(backup.revision, 3)
        self.row.refresh_from_db();self.assertEqual(self.row.state,rules.empty_state())
        self.photo.refresh_from_db();self.assertEqual(bytes(self.photo.data),b'\xff\xd8\xffsynthetic')

    def test_reset_also_backs_up_empty_corrupt_records(self):
        self.row.state={};self.row.save()
        self.assertEqual(self.post({'kind':'reset'}).status_code,200)
        self.assertEqual(apps.get_model('game','GameStateBackup').objects.get(user=self.bob).state,{})

    def test_healthy_reset_is_refused(self):
        self.assertEqual(self.post({'kind':'reset'}).status_code,400)
        self.assertEqual(apps.get_model('game','GameStateBackup').objects.count(),0)

    def test_backup_failure_cannot_reset_progress(self):
        original={'broken':'record'};self.row.state=original;self.row.save()
        model=apps.get_model('game','GameStateBackup')
        with patch.object(model.objects,'create',side_effect=DatabaseError('synthetic backup failure')):
            self.assertEqual(self.post({'kind':'reset'}).status_code,503)
        self.row.refresh_from_db();self.assertEqual(self.row.state,original)
        self.assertEqual(model.objects.count(),0)
        self.assertTrue(GamePhoto.objects.filter(pk=self.photo.pk).exists())

    def test_photo_corruption_blocks_snapshot_and_is_backed_up_without_erasing_bytes(self):
        self.photo.created_ms=-1;self.photo.save()
        valid=GamePhoto.objects.create(user=self.bob,key='cau-rong:detail-photo',destination_id='cau-rong',mission_id='detail-photo',data=b'\xff\xd8\xffvalid',created_ms=777)
        self.assertEqual(self.client.get('/api/auth/game',HTTP_X_DANA_USER=str(self.bob.pk)).status_code,422)
        self.assertEqual(self.post({'kind':'delete-photo','revision':3,'photoId':self.photo.key}).status_code,422)
        self.assertEqual(self.post({'kind':'reset'}).status_code,200)
        backup=apps.get_model('game','GameStateBackup').objects.get(user=self.bob)
        self.assertEqual(backup.photos[0]['createdAt'],-1)
        self.assertEqual(backup.photos[0]['data'],'/9j/c3ludGhldGlj')
        self.row.refresh_from_db();self.assertEqual(self.row.state,valid_state())
        self.photo.refresh_from_db();self.assertEqual(self.photo.created_ms,-1)
        self.assertEqual(bytes(self.photo.data),b'\xff\xd8\xffsynthetic')
        response=self.client.get('/api/auth/game?photos=full',HTTP_X_DANA_USER=str(self.bob.pk))
        self.assertEqual(response.status_code,200)
        self.assertEqual([item['id'] for item in response.json()['photos']],[valid.key])
        self.assertEqual(response.json()['photos'][0]['createdAt'],777)
        self.assertEqual(self.post({'kind':'reset'}).status_code,400)

    def test_photo_validator_rejects_nested_metadata_and_keeps_valid_legacy_photo(self):
        photo={'id':'cau-rong:overview-photo','destinationId':'cau-rong','missionId':'overview-photo','createdAt':1000,'data':'/9j/c3ludGhldGlj'}
        self.assertTrue(rules.is_healthy(valid_state(),[photo]))
        for key,value in [('id','wrong'),('missionId',{}),('destinationId',[]),('createdAt',True),('createdAt',-1),('data','not-base64')]:
            with self.subTest(key=key,value=value):
                self.assertFalse(rules.is_healthy(valid_state(),[{**photo,key:value}]))
        self.assertFalse(rules.is_healthy(valid_state(),[photo,photo]))

    def test_oversized_json_integer_is_corrupt_not_an_uncaught_server_error(self):
        state=valid_state();state['destinations']['cau-rong']['startedAt']=10**400
        self.assertFalse(rules.is_healthy(state))
