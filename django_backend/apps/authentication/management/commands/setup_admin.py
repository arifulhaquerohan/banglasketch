from django.core.management.base import BaseCommand
from django.contrib.auth.models import User
from apps.authentication.models import AdminUser
import getpass
import secrets
import string

class Command(BaseCommand):
    help = "Ensures a Django superuser exists matching the studio owner in admin_users"

    def add_arguments(self, parser):
        parser.add_argument("--password", type=str, default=None, help="Password for the superuser")

    def handle(self, *args, **options):
        owner = AdminUser.objects.filter(role="owner").first() or AdminUser.objects.first()
        email = owner.email if owner else "admin@banglasketch.com"
        username = email.split("@")[0]

        password = options.get("password")
        if not password:
            try:
                password = getpass.getpass(f"Enter password for superuser {username}: ")
            except EOFError:
                # Non-interactive mode (e.g. CI)
                print("Error: Password required for superuser creation in non-interactive mode.")
                print("Use --password <password> to specify it.")
                return

        if not password or len(password) < 8:
            self.stdout.write(self.style.ERROR("Password must be at least 8 characters long."))
            return

        user, created = User.objects.get_or_create(
            username=username,
            defaults={"email": email, "is_staff": True, "is_superuser": True},
        )
        user.email = email
        user.is_staff = True
        user.is_superuser = True
        user.set_password(password)
        user.save()

        action = "Created" if created else "Updated"
        self.stdout.write(self.style.SUCCESS(
            f"{action} Django admin superuser:\n"
            f"  Username: {username}\n"
            f"  Email: {email}\n"
            f"  URL: http://localhost:5000/django-admin/"
        ))
