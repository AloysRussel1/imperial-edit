from datetime import timedelta
from pathlib import Path

import environ

BASE_DIR = Path(__file__).resolve().parent.parent.parent

env = environ.Env()
environ.Env.read_env(BASE_DIR.parent / ".env")

SECRET_KEY = env("DJANGO_SECRET_KEY", default="insecure-dev-key")
DEBUG = env.bool("DJANGO_DEBUG", default=False)
ALLOWED_HOSTS = env.list("DJANGO_ALLOWED_HOSTS", default=[])

INSTALLED_APPS = [
    "jazzmin",  # doit précéder django.contrib.admin
    "django.contrib.admin",
    "django.contrib.auth",
    "django.contrib.contenttypes",
    "django.contrib.sessions",
    "django.contrib.messages",
    "django.contrib.staticfiles",
    # Third-party
    "rest_framework",
    "rest_framework_simplejwt",
    "corsheaders",
    "django_filters",
    "drf_spectacular",
    "django_celery_beat",
    "django_celery_results",
    # Local apps
    "apps.common",
    "apps.users",
    "apps.products",
    "apps.orders",
    "apps.payments",
    "apps.promotions",
    "apps.sourcing",
    "apps.notifications",
]

MIDDLEWARE = [
    "django.middleware.security.SecurityMiddleware",
    "corsheaders.middleware.CorsMiddleware",
    "django.contrib.sessions.middleware.SessionMiddleware",
    "django.middleware.common.CommonMiddleware",
    "django.middleware.csrf.CsrfViewMiddleware",
    "django.contrib.auth.middleware.AuthenticationMiddleware",
    "django.contrib.messages.middleware.MessageMiddleware",
    "django.middleware.clickjacking.XFrameOptionsMiddleware",
]

ROOT_URLCONF = "core.urls"

TEMPLATES = [
    {
        "BACKEND": "django.template.backends.django.DjangoTemplates",
        "DIRS": [],
        "APP_DIRS": True,
        "OPTIONS": {
            "context_processors": [
                "django.template.context_processors.debug",
                "django.template.context_processors.request",
                "django.contrib.auth.context_processors.auth",
                "django.contrib.messages.context_processors.messages",
            ],
        },
    },
]

WSGI_APPLICATION = "core.wsgi.application"
ASGI_APPLICATION = "core.asgi.application"

# ==== Database ====
DATABASES = {
    "default": env.db(
        "DATABASE_URL",
        default=f"postgres://{env('POSTGRES_USER', default='imperial_edit')}:"
        f"{env('POSTGRES_PASSWORD', default='changeme')}@"
        f"{env('POSTGRES_HOST', default='db')}:"
        f"{env('POSTGRES_PORT', default='5432')}/"
        f"{env('POSTGRES_DB', default='imperial_edit')}",
    )
}

AUTH_USER_MODEL = "users.User"

# Autorise la connexion par e-mail OU par username (ex. le compte admin
# bootstrap via create_prod_superuser, dont le username peut différer de
# l'e-mail) — le ModelBackend par défaut est conservé en repli.
AUTHENTICATION_BACKENDS = [
    "apps.users.backends.EmailOrUsernameModelBackend",
    "django.contrib.auth.backends.ModelBackend",
]

AUTH_PASSWORD_VALIDATORS = [
    {"NAME": "django.contrib.auth.password_validation.UserAttributeSimilarityValidator"},
    {"NAME": "django.contrib.auth.password_validation.MinimumLengthValidator"},
    {"NAME": "django.contrib.auth.password_validation.CommonPasswordValidator"},
    {"NAME": "django.contrib.auth.password_validation.NumericPasswordValidator"},
]

LANGUAGE_CODE = "fr-fr"
TIME_ZONE = "Europe/Paris"
USE_I18N = True
USE_TZ = True

STATIC_URL = "static/"
STATIC_ROOT = BASE_DIR / "staticfiles"
STATICFILES_DIRS = [BASE_DIR / "static"]
MEDIA_URL = "media/"
MEDIA_ROOT = BASE_DIR / "media"

DEFAULT_AUTO_FIELD = "django.db.models.BigAutoField"

# ==== DRF ====
REST_FRAMEWORK = {
    "DEFAULT_AUTHENTICATION_CLASSES": (
        "rest_framework_simplejwt.authentication.JWTAuthentication",
    ),
    "DEFAULT_PERMISSION_CLASSES": ("rest_framework.permissions.IsAuthenticated",),
    "DEFAULT_FILTER_BACKENDS": ("django_filters.rest_framework.DjangoFilterBackend",),
    "DEFAULT_PAGINATION_CLASS": "apps.common.pagination.DefaultPagination",
    "PAGE_SIZE": 20,
    "DEFAULT_SCHEMA_CLASS": "drf_spectacular.openapi.AutoSchema",
}

SPECTACULAR_SETTINGS = {
    "TITLE": "The Imperial Collection API",
    "DESCRIPTION": "API back-office & storefront pour The Imperial Collection.",
    "VERSION": "1.0.0",
}

SIMPLE_JWT = {
    "ACCESS_TOKEN_LIFETIME": timedelta(
        minutes=env.int("JWT_ACCESS_TOKEN_LIFETIME_MIN", default=15)
    ),
    "REFRESH_TOKEN_LIFETIME": timedelta(
        days=env.int("JWT_REFRESH_TOKEN_LIFETIME_DAYS", default=7)
    ),
    "ROTATE_REFRESH_TOKENS": True,
    "BLACKLIST_AFTER_ROTATION": True,
    "AUTH_HEADER_TYPES": ("Bearer",),
}

CORS_ALLOWED_ORIGINS = env.list("DJANGO_CORS_ALLOWED_ORIGINS", default=[])

# ==== Celery ====
CELERY_BROKER_URL = env("CELERY_BROKER_URL", default="redis://redis:6379/1")
CELERY_RESULT_BACKEND = env("CELERY_RESULT_BACKEND", default="redis://redis:6379/2")
CELERY_ACCEPT_CONTENT = ["json"]
CELERY_TASK_SERIALIZER = "json"
CELERY_RESULT_SERIALIZER = "json"
CELERY_TIMEZONE = TIME_ZONE
CELERY_BEAT_SCHEDULER = "django_celery_beat.schedulers:DatabaseScheduler"

# ==== Business rules ====
STOCK_RESERVATION_TIMEOUT_MINUTES = env.int(
    "STOCK_RESERVATION_TIMEOUT_MINUTES", default=30
)
DEFAULT_CURRENCY = env("DEFAULT_CURRENCY", default="XAF")
SECONDARY_CURRENCY = env("SECONDARY_CURRENCY", default="EUR")
EUR_XAF_RATE = env.float("EUR_XAF_RATE", default=655.957)
WHATSAPP_ADMIN_PHONE_NUMBER = env("WHATSAPP_ADMIN_PHONE_NUMBER", default="")

# ==== Notifications (WhatsApp Cloud API) ====
# Vide par défaut : les notifications WhatsApp sont alors simplement
# journalisées (voir apps.notifications) au lieu d'appeler l'API réelle —
# même logique de repli que les passerelles de paiement.
WHATSAPP_API_URL = env("WHATSAPP_API_URL", default="https://graph.facebook.com/v19.0")
WHATSAPP_ACCESS_TOKEN = env("WHATSAPP_ACCESS_TOKEN", default="")
WHATSAPP_PHONE_NUMBER_ID = env("WHATSAPP_PHONE_NUMBER_ID", default="")

# ==== E-mail transactionnel ====
# Backend SMTP générique — compatible tel quel avec un relais SMTP Resend ou
# Brevo (il suffit de renseigner leurs identifiants SMTP respectifs dans
# EMAIL_HOST / EMAIL_HOST_USER / EMAIL_HOST_PASSWORD), sans changer de code.
EMAIL_BACKEND = env("EMAIL_BACKEND", default="django.core.mail.backends.smtp.EmailBackend")
EMAIL_HOST = env("EMAIL_HOST", default="")
EMAIL_PORT = env.int("EMAIL_PORT", default=587)
EMAIL_HOST_USER = env("EMAIL_HOST_USER", default="")
EMAIL_HOST_PASSWORD = env("EMAIL_HOST_PASSWORD", default="")
EMAIL_USE_TLS = env.bool("EMAIL_USE_TLS", default=True)
DEFAULT_FROM_EMAIL = env(
    "DEFAULT_FROM_EMAIL", default="Imperial Collection <notifications@imperialcollection.com>"
)

# ==== Frontend (liens embarqués dans les e-mails transactionnels) ====
FRONTEND_URL = env("FRONTEND_URL", default="http://localhost:3000")

# Durée de validité d'un lien de réinitialisation de mot de passe (en secondes).
PASSWORD_RESET_TIMEOUT = 60 * 60 * 24  # 24h

# ==== Payment aggregators ====
CINETPAY_API_KEY = env("CINETPAY_API_KEY", default="")
CINETPAY_SITE_ID = env("CINETPAY_SITE_ID", default="")
CINETPAY_SECRET_KEY = env("CINETPAY_SECRET_KEY", default="")
CINETPAY_NOTIFY_URL = env("CINETPAY_NOTIFY_URL", default="")
CINETPAY_RETURN_URL = env("CINETPAY_RETURN_URL", default="")

FLUTTERWAVE_PUBLIC_KEY = env("FLUTTERWAVE_PUBLIC_KEY", default="")
FLUTTERWAVE_SECRET_KEY = env("FLUTTERWAVE_SECRET_KEY", default="")
FLUTTERWAVE_SECRET_HASH = env("FLUTTERWAVE_SECRET_HASH", default="")

# ==== Media storage ====
MEDIA_STORAGE_BACKEND = env("MEDIA_STORAGE_BACKEND", default="cloudinary")

CLOUDINARY_STORAGE = {
    "CLOUD_NAME": env("CLOUDINARY_CLOUD_NAME", default=""),
    "API_KEY": env("CLOUDINARY_API_KEY", default=""),
    "API_SECRET": env("CLOUDINARY_API_SECRET", default=""),
}

AWS_ACCESS_KEY_ID = env("AWS_ACCESS_KEY_ID", default="")
AWS_SECRET_ACCESS_KEY = env("AWS_SECRET_ACCESS_KEY", default="")
AWS_STORAGE_BUCKET_NAME = env("AWS_STORAGE_BUCKET_NAME", default="")
AWS_S3_REGION_NAME = env("AWS_S3_REGION_NAME", default="eu-west-3")

if MEDIA_STORAGE_BACKEND == "cloudinary":
    INSTALLED_APPS += ["cloudinary_storage", "cloudinary"]
    DEFAULT_FILE_STORAGE = "cloudinary_storage.storage.MediaCloudinaryStorage"
elif MEDIA_STORAGE_BACKEND == "s3":
    INSTALLED_APPS += ["storages"]
    DEFAULT_FILE_STORAGE = "storages.backends.s3boto3.S3Boto3Storage"
else:
    # "local": stockage sur le système de fichiers (MEDIA_ROOT/MEDIA_URL ci-dessus),
    # utilisé en développement tant qu'aucun identifiant Cloudinary/S3 n'est fourni.
    DEFAULT_FILE_STORAGE = "django.core.files.storage.FileSystemStorage"

# ==== Admin Django — thème Jazzmin (Noir & Or, cohérent avec la vitrine) ====
JAZZMIN_SETTINGS = {
    "site_title": "Imperial Collection - Administration",
    "site_header": "Imperial Collection - Administration",
    "site_brand": "Imperial Collection",
    "site_logo": "admin/img/logo.png",
    "site_logo_classes": "elevation-0",
    "site_icon": "admin/img/favicon.png",
    "login_logo": "admin/img/logo.png",
    "login_logo_dark": "admin/img/logo.png",
    "welcome_sign": "Bienvenue dans l'espace d'administration Imperial Collection",
    "copyright": "Imperial Collection",
    "search_model": ["orders.Order", "sourcing.SourcingRequest", "products.Product", "payments.Transaction"],
    "user_avatar": None,
    "topmenu_links": [
        {"name": "Voir le site", "url": "http://localhost:3000", "new_window": True},
        {"model": "users.User"},
    ],
    "show_sidebar": True,
    "navigation_expanded": True,
    # Priorité d'affichage dans le menu latéral : commandes, sourcing et
    # produits en tête, suivis des transactions et des notifications.
    "order_with_respect_to": [
        "orders",
        "orders.Order",
        "orders.Cart",
        "sourcing",
        "sourcing.SourcingRequest",
        "products",
        "products.Product",
        "products.Category",
        "payments",
        "payments.Transaction",
        "notifications",
        "promotions",
        "users",
        "auth",
    ],
    "icons": {
        "auth": "fas fa-users-cog",
        "auth.Group": "fas fa-users",
        "users.User": "fas fa-user-tie",
        "orders.Order": "fas fa-receipt",
        "orders.Cart": "fas fa-shopping-cart",
        "orders.CartItem": "fas fa-shopping-basket",
        "sourcing.SourcingRequest": "fas fa-camera-retro",
        "products.Product": "fas fa-gem",
        "products.Category": "fas fa-tags",
        "payments.Transaction": "fas fa-credit-card",
        "notifications.NotificationLog": "fas fa-bell",
        "promotions.Coupon": "fas fa-percent",
    },
    "default_icon_parents": "fas fa-chevron-circle-right",
    "default_icon_children": "fas fa-circle",
    "related_modal_active": True,
    "custom_css": "admin/css/imperial-jazzmin.css",
    "show_ui_builder": False,
    "changeform_format": "horizontal_tabs",
}

JAZZMIN_UI_TWEAKS = {
    "navbar_small_text": False,
    "footer_small_text": False,
    "body_small_text": False,
    "brand_small_text": False,
    "brand_colour": "navbar-dark",
    "accent": "accent-warning",
    "navbar": "navbar-dark",
    "no_navbar_border": True,
    "navbar_fixed": True,
    "layout_boxed": False,
    "footer_fixed": False,
    "sidebar_fixed": True,
    "sidebar": "sidebar-dark-warning",
    "sidebar_nav_small_text": False,
    "sidebar_disable_expand": False,
    "sidebar_nav_child_indent": True,
    "sidebar_nav_compact_style": False,
    "sidebar_nav_legacy_style": False,
    "sidebar_nav_flat_style": False,
    "theme": "darkly",
    "dark_mode_theme": "darkly",
    "button_classes": {
        "primary": "btn-warning",
        "secondary": "btn-outline-light",
        "info": "btn-info",
        "warning": "btn-warning",
        "danger": "btn-danger",
        "success": "btn-success",
    },
}
