import json
from django.contrib.auth import get_user_model
from django.test import TestCase


class GroupAuthRouteTests(TestCase):
    def test_groups_are_available_under_the_selected_account_api(self):
        user = get_user_model().objects.create_user(username='group-route-owner', password='test-only-password')
        self.client.force_login(user)
        response = self.client.post('/api/auth/groups/create', json.dumps({'name': 'Bạn bè khám phá'}), content_type='application/json', HTTP_X_DANA_USER=str(user.pk))
        self.assertEqual(response.status_code, 200)
        response = self.client.get('/api/auth/groups/my', HTTP_X_DANA_USER=str(user.pk))
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.json()['groups']), 1)
        group = response.json()['groups'][0]
        response = self.client.post('/api/auth/groups/leave', json.dumps({'groupId': group['id']}), content_type='application/json', HTTP_X_DANA_USER=str(user.pk))
        self.assertEqual(response.status_code, 200)
