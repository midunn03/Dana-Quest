from django.contrib import admin
from django.contrib.auth import get_user_model
from django.test import TestCase

from pixels.models import Place
from events.models import Event
from django.apps import apps


class AdminFeedTests(TestCase):
    def test_public_catalogs_remain_public_but_reject_supplied_stale_tab(self):
        user=get_user_model().objects.create_user(username='feed-owner')
        for path in ('/api/pixel/places','/api/events/feed'):
            self.assertEqual(self.client.get(path).status_code,200)
        self.client.force_login(user)
        for path in ('/api/pixel/places','/api/events/feed'):
            self.assertEqual(self.client.get(path).status_code,200)
            self.assertEqual(self.client.get(path,HTTP_X_DANA_USER='stale').status_code,409)
            self.assertEqual(self.client.post(path,{},HTTP_X_DANA_USER='stale').status_code,409)
            self.assertEqual(self.client.post(path,{},HTTP_X_DANA_USER=str(user.pk)).status_code,405)

    def test_admin_catalog_permissions_and_edits_remain_usable_without_custom_headers(self):
        staff=get_user_model().objects.create_superuser(username='test-admin',password='synthetic-only')
        self.client.force_login(staff)
        for model,path in ((Place,'/admin/pixels/place/'),(Event,'/admin/events/event/')):
            self.assertTrue(admin.site.is_registered(model))
            self.assertEqual(self.client.get(path).status_code,200)
        place=Place.objects.create(name='Synthetic place',slug='synthetic-admin',latitude=16,longitude=108)
        place.description='Updated admin content';place.save()
        self.assertEqual(self.client.get('/api/pixel/places').json()['places'][0]['description'],'Updated admin content')
        self.client.logout()
        self.assertEqual(self.client.get('/admin/pixels/place/').status_code,302)

    def test_quest_admin_is_registered_read_only_for_progress_and_backup(self):
        for name in ('QuestRunState','GameStateBackup','QuestActivationCode'):
            model=apps.get_model('game',name)
            self.assertTrue(admin.site.is_registered(model),name)
        staff=get_user_model().objects.create_superuser(username='quest-admin',password='synthetic-only')
        self.client.force_login(staff)
        for path in ('questrunstate','gamestatebackup','questactivationcode'):
            self.assertEqual(self.client.get('/admin/game/'+path+'/').status_code,200)
            self.assertEqual(self.client.get('/admin/game/'+path+'/add/').status_code,403)
