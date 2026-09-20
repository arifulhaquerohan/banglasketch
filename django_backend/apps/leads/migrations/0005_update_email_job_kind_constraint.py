from django.db import migrations


def update_kind_constraint(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("""
            ALTER TABLE contact_email_jobs
            DROP CONSTRAINT IF EXISTS contact_email_jobs_kind_check;

            ALTER TABLE contact_email_jobs
            ADD CONSTRAINT contact_email_jobs_kind_check
            CHECK (kind IN (
                'notification',
                'confirmation',
                'site_visit_notification',
                'site_visit_confirmation'
            ));
        """)


def reverse_kind_constraint(apps, schema_editor):
    if schema_editor.connection.vendor == "postgresql":
        schema_editor.execute("""
            ALTER TABLE contact_email_jobs
            DROP CONSTRAINT IF EXISTS contact_email_jobs_kind_check;

            ALTER TABLE contact_email_jobs
            ADD CONSTRAINT contact_email_jobs_kind_check
            CHECK (kind IN ('notification', 'confirmation'));
        """)


class Migration(migrations.Migration):

    dependencies = [
        ("leads", "0004_alter_contactemailjob_unique_together_and_more"),
    ]

    operations = [
        migrations.RunPython(update_kind_constraint, reverse_kind_constraint),
    ]

