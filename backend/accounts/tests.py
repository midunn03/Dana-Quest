import json
import os
import subprocess
import sys
from pathlib import Path

from django.contrib.auth import get_user_model
from django.test import SimpleTestCase, TestCase

from .models import Profile

OWNER_CHANGED = 'Tài khoản đã thay đổi ở tab khác. Hãy tải lại trang.'


class SettingsSecurityTests(SimpleTestCase):
    def settings_result(self, **variables):
        env = {key: os.environ[key] for key in ('PATH', 'SystemRoot', 'WINDIR', 'TEMP', 'TMP', 'PYTHONPYCACHEPREFIX') if key in os.environ}
        env['PYTHONPATH'] = os.pathsep.join(sys.path)
        env.update(variables)
        script = "import json; import config.settings as s; print(json.dumps({'debug':s.DEBUG,'hosts':s.ALLOWED_HOSTS,'origins':s.CSRF_TRUSTED_ORIGINS,'test_key':s.SECRET_KEY=='supplied-test-only-key'}))"
        return subprocess.run([sys.executable, '-c', script], cwd=Path(__file__).resolve().parents[1], env=env, capture_output=True, text=True)

    def test_production_requires_explicit_non_development_key(self):
        for values in ({}, {'DJANGO_SECRET_KEY': ''}, {'DJANGO_SECRET_KEY': 'chi-dung-khi-phat-trien'}):
            with self.subTest(values=list(values)):
                result = self.settings_result(**values)
                self.assertNotEqual(result.returncode, 0)
                self.assertIn('DJANGO_SECRET_KEY', result.stderr)

    def test_debug_defaults_off_and_local_origins_include_5174(self):
        result = self.settings_result(DJANGO_SECRET_KEY='supplied-test-only-key')
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(result.stdout)
        self.assertFalse(data['debug'])
        self.assertTrue(data['test_key'])
        self.assertIn('http://127.0.0.1:5174', data['origins'])
        self.assertIn('http://localhost:5174', data['origins'])

    def test_development_key_is_available_only_with_debug_one(self):
        result = self.settings_result(DJANGO_DEBUG='1')
        self.assertEqual(result.returncode, 0, result.stderr)
        self.assertTrue(json.loads(result.stdout)['debug'])
        self.assertNotEqual(self.settings_result(DJANGO_DEBUG='true').returncode, 0)

    def test_hosts_and_origins_are_explicit_comma_separated_environment_values(self):
        result = self.settings_result(DJANGO_SECRET_KEY='supplied-test-only-key', DJANGO_ALLOWED_HOSTS=' app.example.test, localhost, ', DJANGO_CSRF_TRUSTED_ORIGINS='https://app.example.test, http://localhost:5174, ')
        self.assertEqual(result.returncode, 0, result.stderr)
        data = json.loads(result.stdout)
        self.assertEqual(data['hosts'], ['app.example.test', 'localhost'])
        self.assertEqual(data['origins'], ['https://app.example.test', 'http://localhost:5174'])


class AccountOwnerTests(TestCase):
    @classmethod
    def setUpTestData(cls):
        cls.alice = get_user_model().objects.create_user(username='owner-a', password='synthetic-password')
        cls.bob = get_user_model().objects.create_user(username='owner-b', password='synthetic-password')
        Profile.objects.create(user=cls.alice, avatar_id='bien')
        Profile.objects.create(user=cls.bob, avatar_id='nang')

    def setUp(self):
        self.client.force_login(self.bob)

    def test_session_bootstraps_without_owner_but_rejects_a_stale_owner(self):
        response = self.client.get('/api/auth/session')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user']['id'], str(self.bob.pk))
        response = self.client.get('/api/auth/session', HTTP_X_DANA_USER=str(self.alice.pk))
        self.assertEqual(response.status_code, 409)
        self.assertEqual(response.json()['message'], OWNER_CHANGED)

    def test_private_profile_mutations_reject_missing_and_wrong_owner(self):
        for path, data in [('/api/auth/profile', {'name':'unexpected-change'}), ('/api/auth/profile/avatar', {'avatarId':'rung'})]:
            for headers in ({}, {'HTTP_X_DANA_USER': str(self.alice.pk)}):
                with self.subTest(path=path, supplied=bool(headers)):
                    response = self.client.patch(path, json.dumps(data), content_type='application/json', **headers)
                    self.assertEqual(response.status_code, 409)
                    self.assertEqual(response.json()['message'], OWNER_CHANGED)
        self.bob.refresh_from_db()
        self.assertEqual(self.bob.username, 'owner-b')
        self.assertEqual(Profile.objects.get(user=self.bob).avatar_id, 'nang')

    def test_correct_owner_can_update_profile_and_avatar(self):
        headers = {'HTTP_X_DANA_USER': str(self.bob.pk)}
        response = self.client.patch('/api/auth/profile', json.dumps({'name':'owner-b-updated'}), content_type='application/json', **headers)
        self.assertEqual(response.status_code, 200)
        response = self.client.patch('/api/auth/profile/avatar', json.dumps({'avatarId':'rung'}), content_type='application/json', **headers)
        self.assertEqual(response.status_code, 200)
        self.assertEqual(response.json()['user']['avatarId'], 'rung')

    def test_stale_logout_does_not_destroy_the_new_cookie_session(self):
        response = self.client.post('/api/auth/logout', HTTP_X_DANA_USER=str(self.alice.pk))
        self.assertEqual(response.status_code, 409)
        self.assertEqual(self.client.get('/api/auth/session').status_code, 200)
        self.assertEqual(self.client.post('/api/auth/logout', HTTP_X_DANA_USER=str(self.bob.pk)).status_code, 200)
        self.assertEqual(self.client.get('/api/auth/session').status_code, 401)

    def test_anonymous_bootstrap_and_private_requests_still_require_login(self):
        self.client.logout()
        self.assertEqual(self.client.get('/api/auth/session').status_code, 401)
        self.assertEqual(self.client.patch('/api/auth/profile', '{}', content_type='application/json').status_code, 401)
