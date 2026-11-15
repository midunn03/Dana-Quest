"""Explicit test-only settings: never connect the test process to db.sqlite3."""
import os
import tempfile

os.environ.setdefault('DJANGO_SECRET_KEY', 'django-tests-only-not-a-deployment-key')

from .settings import *  # noqa: F403,E402

DATABASES = {'default': {'ENGINE': 'django.db.backends.sqlite3', 'NAME': ':memory:', 'TEST': {'NAME': ':memory:'}}}
MEDIA_ROOT = os.path.join(tempfile.gettempdir(), 'dana-quest-test-media')
PASSWORD_HASHERS = ['django.contrib.auth.hashers.MD5PasswordHasher']
