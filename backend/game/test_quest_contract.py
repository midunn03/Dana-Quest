import hashlib
import json
import os
from pathlib import Path
import subprocess
from unittest.mock import patch

from django.apps import apps
from django.conf import settings
from django.contrib.auth import get_user_model
from django.test import TestCase
from django.db import OperationalError

NOW = 1793400000000
QUEST = 'due-dau-an-50-nam'
ROOT = Path(settings.BASE_DIR).parent


def scenario():
    actions = [{'type': 'start', 'questId': QUEST}, {'type': 'start', 'questId': QUEST}, {'type': 'continue-story', 'questId': QUEST}, {'type': 'confirm-arrival', 'questId': QUEST}, {'type': 'confirm-arrival', 'questId': QUEST}]
    for checkpoint, answer in [('cong-71', '71'), ('dau-moc-1975', '1975'), ('sap-xep-ky-uc', json.dumps(['1975','2000','2015','2025'])), ('ghep-dau-moc', json.dumps([['2000','25'],['2025','50'],['1975','0'],['2015','40']])), ('mat-thu-tong-ket', json.dumps(['address','start','25','40','50']))]:
        actions += [{'type':'continue-story','questId':QUEST}, {'type':'pause','questId':QUEST}, {'type':'complete-checkpoint','questId':QUEST,'checkpointId':checkpoint,'answer':answer}, {'type':'resume','questId':QUEST}, {'type':'complete-checkpoint','questId':QUEST,'checkpointId':checkpoint,'answer':'wrong'}, {'type':'complete-checkpoint','questId':QUEST,'checkpointId':checkpoint,'answer':answer}, {'type':'complete-checkpoint','questId':QUEST,'checkpointId':checkpoint,'answer':answer}, {'type':'advance','questId':QUEST}]
    actions += [{'type':'start','questId':QUEST}, {'type':'start','questId':'missing'}, {'type':'unsupported','questId':QUEST}]
    codes = [{'code':'DQ'+letter*24,'questId':QUEST,'expiresAt':NOW+60000, **extra} for letter, extra in [('A',{}),('B',{'expiresAt':NOW-1}),('C',{'revoked':True}),('D',{'otherOwner':True})]]
    grades=[]
    for quest in json.loads((ROOT/'src/data/questCatalog.json').read_text(encoding='utf-8')):
        for checkpoint in quest['checkpoints']:
            challenge=checkpoint['challenge'];kind=challenge['type']
            answer = {'text':lambda:challenge['acceptedAnswers'][0], 'single-choice':lambda:challenge['correctOptionId'], 'ordering':lambda:json.dumps(challenge['correctOrder']), 'multi-select':lambda:json.dumps(challenge['correctOptionIds']), 'matching':lambda:json.dumps([[pair['id'],pair['correctOptionId']] for pair in challenge['pairs']]), 'observation':lambda:'confirmed', 'photo':lambda:''}[kind]()
            grades += [{'challenge':challenge,'answer':answer,'photoAvailable':False}, {'challenge':challenge,'answer':'wrong','photoAvailable':False}]
    grades += [{'challenge':{'type':'photo'},'answer':'','photoAvailable':True}, {'challenge':{'type':'photo'},'answer':'','photoAvailable':False}]
    return {'now':NOW,'actions':actions,'codes':codes,'redemptions':['bad','DQ'+'F'*24,'DQ'+'B'*24,'DQ'+'C'*24,'DQ'+'D'*24,'dq-'+ 'a'*24,'DQ'+'A'*24], 'grades':grades}


class QuestContractTests(TestCase):
    def setUp(self):
        self.user=get_user_model().objects.create_user(username='contract-owner')
        self.other=get_user_model().objects.create_user(username='other')
        self.client.force_login(self.user)
        self.headers={'HTTP_X_DANA_USER':str(self.user.pk)}

    def post(self, path, body, headers=None):
        return self.client.post('/api/auth/'+path,json.dumps(body),content_type='application/json',**(self.headers if headers is None else headers))

    def test_real_node_http_contract_matches_django(self):
        data=scenario()
        result=subprocess.run([os.environ.get('DANA_TEST_NODE','node'),str(ROOT/'tests/support/django-contract-oracle.mjs')],input=json.dumps(data),text=True,encoding='utf-8',capture_output=True,timeout=40,cwd=ROOT)
        self.assertEqual(result.returncode,0,result.stderr)
        oracle=json.loads(result.stdout)
        Code=apps.get_model('game','QuestActivationCode')
        for item in data['codes']:
            Code.objects.create(digest=hashlib.sha256(item['code'].encode()).hexdigest(),quest_id=item['questId'],expires_at=item['expiresAt'],created_ms=NOW,revoked=item.get('revoked',False),user=self.other if item.get('otherOwner') else None)
        with patch('time.time',return_value=NOW/1000):
            response=self.client.get('/api/auth/quest-runs',**self.headers)
            self.assertEqual({'status':response.status_code,'body':response.json()},oracle['runs'][0])
            for index,action in enumerate(data['actions']):
                response=self.post('quest-runs',action)
                self.assertEqual({'status':response.status_code,'body':response.json()},oracle['runs'][index+1],str(action))
            for index,code in enumerate(data['redemptions']):
                response=self.post('quest-codes/redeem',{'code':code})
                self.assertEqual({'status':response.status_code,'body':response.json()},oracle['codes'][index],code)
            response=self.client.get('/api/auth/quest-codes',**self.headers)
            self.assertEqual({'status':response.status_code,'body':response.json()},oracle['codes'][-1])
        response=self.client.get('/api/auth/quest-runs',HTTP_X_DANA_USER=str(self.other.pk))
        self.assertEqual({'status':response.status_code,'body':response.json()},oracle['stale'])
        from .quest_rules import challenge_correct
        self.assertEqual([challenge_correct(item['challenge'],item['answer'],item['photoAvailable']) for item in data['grades']],oracle['grades'])

    def test_private_routes_reject_missing_and_stale_owners_before_access(self):
        for path in ('quest-runs','quest-codes','quest-codes/redeem'):
            for headers in ({},{'HTTP_X_DANA_USER':str(self.other.pk)}):
                response=self.post(path,{},headers) if path.endswith('redeem') else self.client.get('/api/auth/'+path,**headers)
                self.assertEqual(response.status_code,409)
            self.assertEqual(self.post(path,{}, {'HTTP_X_DANA_USER':str(self.other.pk)}).status_code,409)

    def test_corrupt_run_is_never_overwritten(self):
        Run=apps.get_model('game','QuestRunState')
        row=Run.objects.create(user=self.user,state={'broken':True})
        self.assertEqual(self.client.get('/api/auth/quest-runs',**self.headers).status_code,422)
        self.assertEqual(self.post('quest-runs',{'type':'start','questId':QUEST}).status_code,422)
        row.refresh_from_db();self.assertEqual(row.state,{'broken':True})

    def test_code_rate_limit_and_anonymous_contracts(self):
        for _ in range(10): self.assertEqual(self.post('quest-codes/redeem',{'code':'bad'}).status_code,400)
        self.assertEqual(self.post('quest-codes/redeem',{'code':'bad'}).status_code,429)
        self.client.logout()
        for path in ('quest-runs','quest-codes'):
            self.assertEqual(self.client.get('/api/auth/'+path).status_code,401)
        self.assertEqual(self.post('quest-codes/redeem',{'code':'bad'}).status_code,401)

    def test_malformed_nested_catalog_versions_return_422_without_overwrite(self):
        Run=apps.get_model('game','QuestRunState')
        for version in ('broken',[],{},True,10**400):
            state={'version':2,'legacy':{'version':1,'destinations':{},'redemptions':[]},'quests':{QUEST:{'catalogVersion':version,'startedAt':NOW,'completedCheckpointIds':[],'completedAtByCheckpoint':{},'phase':'story'}}}
            Run.objects.update_or_create(user=self.user,defaults={'state':state})
            with self.subTest(version=version):
                self.assertEqual(self.client.get('/api/auth/quest-runs',**self.headers).status_code,422)
                self.assertEqual(Run.objects.get(user=self.user).state,state)

    def test_sqlite_write_contention_returns_retryable_json_without_partial_progress(self):
        for path, model, body in [('quest-runs','QuestRunState',{'type':'start','questId':QUEST}),('quest-codes/redeem','QuestCodeAttempts',{'code':'bad'})]:
            with self.subTest(path=path), patch.object(apps.get_model('game',model).objects,'get_or_create',side_effect=OperationalError('database is locked')):
                response=self.post(path,body)
                self.assertEqual(response.status_code,503)
                self.assertIn('message',response.json())
        self.assertFalse(apps.get_model('game','QuestRunState').objects.filter(user=self.user).exists())
