from django.db import migrations


def enable_pg_trgm(apps, schema_editor):
    """Enable PostgreSQL fuzzy search; SQLite is used for lightweight tests."""
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("CREATE EXTENSION IF NOT EXISTS pg_trgm;")


def disable_pg_trgm(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("DROP EXTENSION IF EXISTS pg_trgm;")

class Migration(migrations.Migration):

    dependencies = [
        ('projects', '0001_initial'),
    ]

    operations = [
        migrations.RunPython(enable_pg_trgm, disable_pg_trgm),
    ]
