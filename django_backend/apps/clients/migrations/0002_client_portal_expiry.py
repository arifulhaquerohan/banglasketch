from datetime import timedelta

from django.db import migrations, models
from django.utils import timezone
import apps.clients.models


def expire_existing_links(apps, schema_editor):
    # Give existing clients 30 days from deployment, regardless of account age.
    apps.get_model("clients", "Client").objects.using(schema_editor.connection.alias).update(
        portal_token_expires_at=timezone.now() + timedelta(days=30)
    )


class Migration(migrations.Migration):
    dependencies = [("clients", "0001_initial")]
    operations = [
        migrations.AddField(
            model_name="client",
            name="portal_token_expires_at",
            field=models.DateTimeField(default=apps.clients.models.portal_expiry),
        ),
        migrations.RunPython(expire_existing_links, migrations.RunPython.noop),
    ]
