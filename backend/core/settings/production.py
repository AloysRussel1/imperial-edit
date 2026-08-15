import sentry_sdk
from sentry_sdk.integrations.celery import CeleryIntegration
from sentry_sdk.integrations.django import DjangoIntegration

from .base import *  # noqa: F401,F403
from .base import ALLOWED_HOSTS, CORS_ALLOWED_ORIGINS, MIDDLEWARE, env

DEBUG = False

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "whitenoise.middleware.WhiteNoiseMiddleware",
    *MIDDLEWARE[1:],
]

# ==== Celery sans worker séparé (plan gratuit Render) ====
# Le plan gratuit Render n'autorise qu'un seul service ("web"), sans
# "background worker" additionnel — impossible d'y faire tourner
# `celery worker`/`celery beat` en continu. En mode "eager", chaque
# `task.delay(...)` s'exécute directement, de façon synchrone, dans le
# processus qui l'appelle (ici : le worker Gunicorn traitant la requête) —
# aucun changement de code requis aux points d'appel existants. La requête
# HTTP concernée (ex. checkout, changement de statut admin) attend donc que
# l'e-mail/la notification WhatsApp soit réellement envoyé(e) avant de
# répondre — latence acceptée en échange de la simplicité sur ce plan.
#
# Limite assumée : les tâches PLANIFIÉES (Celery Beat — expiration des
# réservations de stock, désactivation des coupons) ne s'exécutent plus du
# tout, faute de processus pour les déclencher périodiquement. À réintroduire
# via un vrai worker Celery (ou un Render Cron Job appelant une management
# command) si vous passez sur un plan payant.
#
# Repasser à False (dans les variables d'environnement Render) uniquement si
# un vrai worker Celery est ajouté au Blueprint.
CELERY_TASK_ALWAYS_EAGER = env.bool("CELERY_TASK_ALWAYS_EAGER", default=True)
CELERY_TASK_EAGER_PROPAGATES = True

# `base.py` configure le stockage média (Cloudinary/S3/local) via l'ancien
# réglage `DEFAULT_FILE_STORAGE` — le dict unifié `STORAGES` (Django 4.2+) est
# mutuellement exclusif avec lui, donc on reste sur son équivalent "ancien
# style" pour les statiques plutôt que de mélanger les deux systèmes.
STATICFILES_STORAGE = "whitenoise.storage.CompressedManifestStaticFilesStorage"

# ==== Hébergement Render : domaines `*.onrender.com` ====
# Render attribue parfois un suffixe d'instance au sous-domaine du service
# (ex. "imperial-backend-iwu8.onrender.com" plutôt que
# "imperial-backend.onrender.com") — potentiellement différent à chaque
# nouvelle instance. RENDER_EXTERNAL_HOSTNAME (fourni automatiquement par
# Render à l'exécution) couvre déjà la valeur exacte quelle qu'elle soit ; le
# wildcard ".onrender.com" couvre tout sous-domaine par construction. Les
# deux valeurs connues sont listées explicitement en plus, en pure défense en
# profondeur si l'un de ces deux mécanismes venait à changer.
ALLOWED_HOSTS = [
    *ALLOWED_HOSTS,
    ".onrender.com",
    "imperial-backend-iwu8.onrender.com",
    "imperial-backend.onrender.com",
]
render_external_hostname = env("RENDER_EXTERNAL_HOSTNAME", default="")
if render_external_hostname:
    ALLOWED_HOSTS.append(render_external_hostname)

# ==== Frontend Vercel : previews (*.vercel.app) + domaine(s) de prod ====
# Domaine de production connu ajouté explicitement en plus de
# DJANGO_CORS_ALLOWED_ORIGINS (défini via le dashboard Render, `sync: false`
# dans render.yaml — donc jamais garanti d'être réellement renseigné) : ne
# jamais dépendre uniquement d'une variable d'environnement facultative pour
# une origine de production connue. Le regex ci-dessous couvre en plus tous
# les sous-domaines de preview Vercel (générés à chaque déploiement), qui ne
# peuvent eux jamais être listés à l'avance.
CORS_ALLOWED_ORIGINS = [
    *CORS_ALLOWED_ORIGINS,
    "https://imperial-edit.vercel.app",
]
CORS_ALLOWED_ORIGIN_REGEXES = [
    r"^https://.*\.vercel\.app$",
]
CORS_ALLOW_CREDENTIALS = True

# Django exige que CSRF_TRUSTED_ORIGINS liste des schémas complets (avec
# wildcard de sous-domaine supporté nativement depuis Django 4). Les origines
# Render elles-mêmes sont incluses pour couvrir la connexion à l'admin Django
# directement sur son domaine (formulaire de login, authentification par
# session — sans lien avec l'API JWT du frontend).
CSRF_TRUSTED_ORIGINS = [
    "https://*.vercel.app",
    "https://imperial-backend-iwu8.onrender.com",
    "https://imperial-backend.onrender.com",
    *[origin for origin in CORS_ALLOWED_ORIGINS if origin.startswith("https://")],
]

# Render (comme la plupart des PaaS) termine le TLS à la frontière et transmet
# la requête en HTTP en interne avec cet en-tête — sans ce réglage,
# SECURE_SSL_REDIRECT provoquerait une boucle de redirection infinie.
SECURE_PROXY_SSL_HEADER = ("HTTP_X_FORWARDED_PROTO", "https")

SECURE_SSL_REDIRECT = True
SESSION_COOKIE_SECURE = True
CSRF_COOKIE_SECURE = True
SECURE_HSTS_SECONDS = 31536000
SECURE_HSTS_INCLUDE_SUBDOMAINS = True
SECURE_HSTS_PRELOAD = True
SECURE_BROWSER_XSS_FILTER = True
SECURE_CONTENT_TYPE_NOSNIFF = True

sentry_dsn = env("SENTRY_DSN", default="")
if sentry_dsn:
    sentry_sdk.init(
        dsn=sentry_dsn,
        integrations=[DjangoIntegration(), CeleryIntegration()],
        traces_sample_rate=0.2,
        send_default_pii=False,
    )
