from django.db import migrations, models


class Migration(migrations.Migration):
    dependencies = [('accounts', '0002_alter_profile_avatar_id')]
    operations = [migrations.CreateModel(
        name='ApiRateBucket',
        fields=[
            ('key', models.CharField(max_length=64, primary_key=True, serialize=False)),
            ('count', models.PositiveIntegerField(default=0)),
            ('expires_ms', models.BigIntegerField(db_index=True)),
        ],
    )]
