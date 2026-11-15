import json

from django.contrib.auth import get_user_model
from django.test import TestCase


class RateLimitTests(TestCase):
    def test_account_budget_cannot_be_reset_by_changing_ip(self):
        user = get_user_model().objects.create_user(username='api-owner')
        self.client.force_login(user)
        for index in range(120):
            self.assertEqual(self.client.get('/api/auth/session', REMOTE_ADDR=f'198.51.100.{index + 1}').status_code, 200)
        response = self.client.get('/api/auth/session', REMOTE_ADDR='203.0.113.1')
        self.assertEqual(response.status_code, 429)

    def test_all_api_requests_have_an_ip_budget_and_retry_after(self):
        for _ in range(120):
            self.assertEqual(self.client.get('/api/auth/session').status_code, 401)
        response = self.client.get('/api/auth/session', HTTP_X_FORWARDED_FOR='198.51.100.7')
        self.assertEqual(response.status_code, 429)
        self.assertGreater(int(response['Retry-After']), 0)

    def test_login_budget_is_shared_by_username_and_email_and_clients(self):
        get_user_model().objects.create_user(username='limit-owner', email='limit@example.test', password='synthetic-password')
        for index in range(5):
            response = self.client.post('/api/auth/login', json.dumps({
                'username': 'LIMIT@EXAMPLE.TEST' if index % 2 else 'limit-owner',
                'password': 'wrong-password',
            }), content_type='application/json', REMOTE_ADDR=f'198.51.100.{index + 1}')
            self.assertEqual(response.status_code, 401)
        response = self.client.post('/api/auth/login', json.dumps({
            'username': 'limit-owner', 'password': 'synthetic-password',
        }), content_type='application/json', REMOTE_ADDR='203.0.113.1')
        self.assertEqual(response.status_code, 429)
        self.assertGreater(int(response['Retry-After']), 0)
