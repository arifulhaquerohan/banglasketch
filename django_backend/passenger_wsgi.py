import os
import sys

# Ensure the backend directory is on the Python path
CURRENT_DIR = os.path.dirname(os.path.abspath(__file__))
if CURRENT_DIR not in sys.path:
    sys.path.insert(0, CURRENT_DIR)

# Set Django settings module
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'banglasketch_api.settings')

# Import and expose WSGI application for Phusion Passenger
from django.core.wsgi import get_wsgi_application
application = get_wsgi_application()
