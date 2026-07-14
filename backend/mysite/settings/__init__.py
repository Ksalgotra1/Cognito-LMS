"""
Settings package initializer.
Automatically selects dev or prod based on DJANGO_ENV environment variable.
Default: dev (safe for local development).
"""

import os

env = os.getenv("DJANGO_ENV", "dev")

if env == "prod":
    from .prod import *
else:
    from .dev import *
