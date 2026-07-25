from .base import *  # noqa: F401,F403
from .base import INSTALLED_APPS, MIDDLEWARE

DEBUG = True

INSTALLED_APPS += ["debug_toolbar"]
MIDDLEWARE = ["debug_toolbar.middleware.DebugToolbarMiddleware", *MIDDLEWARE]

INTERNAL_IPS = ["127.0.0.1"]

CORS_ALLOW_ALL_ORIGINS = True

# Aucun serveur SMTP en développement : les e-mails s'affichent dans les logs
# (stdout du conteneur web / celery_worker) plutôt que d'échouer silencieusement
# ou de bloquer sur une connexion refusée.
EMAIL_BACKEND = "django.core.mail.backends.console.EmailBackend"
