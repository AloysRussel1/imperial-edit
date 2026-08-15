from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
from django.db import IntegrityError
from django.utils import timezone
from django.utils.http import urlsafe_base64_decode
from rest_framework import serializers
from rest_framework_simplejwt.serializers import TokenObtainPairSerializer

from .models import EmailVerificationOTP, User, UserRole


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = (
            "id",
            "email",
            "first_name",
            "last_name",
            "role",
            "phone_number",
            "whatsapp_number",
            "city",
            "country",
        )
        read_only_fields = ("id", "role")


class RegisterSerializer(serializers.ModelSerializer):
    """
    L'inscription publique crée strictement un compte CLIENT — aucun champ
    `role` n'est accepté ici (ce projet a un temps permis de choisir
    customer/vendor à l'inscription ; revenu en arrière pour la boutique de
    Yaoundé, où seule la propriétaire crée les comptes du personnel de caisse,
    depuis le Backoffice Django déjà lié dans le menu compte admin — le
    formulaire d'ajout d'utilisateur y expose déjà `role`, voir UserAdmin).
    Le modèle a de toute façon `role=UserRole.CUSTOMER` par défaut.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "phone_number", "whatsapp_number", "city")

    def validate_email(self, value):
        # `User.email` (hérité d'AbstractUser) n'a pas `unique=True` en base —
        # seul `username` l'est, et `create()` lui affecte la valeur de
        # `email` par convention. Sans cette vérification explicite, DRF ne
        # génère aucun UniqueValidator ici (il ne le fait que pour les champs
        # réellement uniques au niveau du modèle), et une adresse déjà
        # inscrite plantait avec un IntegrityError non rattrapé (500) au lieu
        # d'un 400 propre.
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cette adresse e-mail.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Compte créé inactif : reste inutilisable pour se connecter (voir
        # EmailOrUsernameModelBackend, qui rejette is_active=False) tant que
        # le code OTP envoyé par e-mail n'a pas été validé — voir
        # VerifyEmailSerializer et RegisterView.perform_create.
        user = User(username=validated_data["email"], is_active=False, **validated_data)
        user.set_password(password)
        try:
            user.save()
        except IntegrityError:
            # Filet contre la fenêtre de course entre validate_email() et ce
            # save() (deux inscriptions concurrentes avec la même adresse) :
            # la contrainte unique de `username` protège toujours l'intégrité
            # des données, mais ne doit plus jamais remonter en 500 brut.
            raise serializers.ValidationError({"email": "Un compte existe déjà avec cette adresse e-mail."})
        return user


class AdminStaffSerializer(serializers.ModelSerializer):
    """
    Création de comptes personnel (caissier/vendeur) par l'admin — jamais un
    flux d'auto-inscription : contrairement à `RegisterSerializer`, le compte
    est actif immédiatement (l'admin identifie elle-même la personne en face
    d'elle, pas besoin d'un code OTP pour prouver la possession de
    l'adresse) et `role` est toujours figé à "vendor" ici, quoi que le
    client envoie — un compte admin ne se crée que depuis le Backoffice
    Django, jamais par cet endpoint.
    """

    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ("id", "email", "password", "first_name", "last_name", "role", "is_active", "date_joined")
        read_only_fields = ("id", "role", "is_active", "date_joined")

    def validate_email(self, value):
        if User.objects.filter(email__iexact=value).exists():
            raise serializers.ValidationError("Un compte existe déjà avec cette adresse e-mail.")
        return value

    def create(self, validated_data):
        password = validated_data.pop("password")
        user = User(
            username=validated_data["email"],
            is_active=True,
            is_email_verified=True,
            role=UserRole.VENDOR,
            **validated_data,
        )
        user.set_password(password)
        try:
            user.save()
        except IntegrityError:
            raise serializers.ValidationError({"email": "Un compte existe déjà avec cette adresse e-mail."})
        return user


class VerifyEmailSerializer(serializers.Serializer):
    email = serializers.EmailField()
    code = serializers.RegexField(r"^\d{6}$")

    def validate(self, attrs):
        user = User.objects.filter(email__iexact=attrs["email"]).first()
        # Message volontairement identique pour "compte introuvable" et "code
        # invalide" : ne jamais laisser un attaquant confirmer par ce biais
        # qu'une adresse e-mail donnée est ou non déjà inscrite.
        generic_error = {"code": "Code invalide ou expiré."}
        if user is None:
            raise serializers.ValidationError(generic_error)

        otp = (
            EmailVerificationOTP.objects.filter(user=user, is_used=False)
            .order_by("-created_at")
            .first()
        )
        if otp is None or otp.is_expired or otp.attempts >= EmailVerificationOTP.MAX_ATTEMPTS:
            raise serializers.ValidationError(generic_error)

        if otp.code != attrs["code"]:
            otp.attempts += 1
            otp.save(update_fields=["attempts", "updated_at"])
            raise serializers.ValidationError(generic_error)

        attrs["user"] = user
        attrs["otp"] = otp
        return attrs

    def save(self, **kwargs):
        user: User = self.validated_data["user"]
        otp: EmailVerificationOTP = self.validated_data["otp"]
        otp.is_used = True
        otp.save(update_fields=["is_used", "updated_at"])
        user.is_email_verified = True
        user.is_active = True
        user.save(update_fields=["is_email_verified", "is_active"])
        return user


class ResendOTPSerializer(serializers.Serializer):
    email = serializers.EmailField()

    RESEND_COOLDOWN_SECONDS = 60

    def validate_email(self, value):
        user = User.objects.filter(email__iexact=value).first()
        if user is None:
            # Même remarque que VerifyEmailSerializer : une réponse identique
            # que le compte existe ou non, gérée dans la vue (200 générique).
            return value
        if user.is_email_verified:
            raise serializers.ValidationError("Cette adresse est déjà vérifiée.")

        last_otp = EmailVerificationOTP.objects.filter(user=user).order_by("-created_at").first()
        if last_otp is not None:
            elapsed = (timezone.now() - last_otp.created_at).total_seconds()
            if elapsed < self.RESEND_COOLDOWN_SECONDS:
                wait = int(self.RESEND_COOLDOWN_SECONDS - elapsed)
                raise serializers.ValidationError(f"Merci de patienter {wait}s avant de redemander un code.")
        return value


class ImperialTokenObtainPairSerializer(TokenObtainPairSerializer):
    @classmethod
    def get_token(cls, user):
        token = super().get_token(user)
        token["role"] = user.role
        token["email"] = user.email
        return token


class PasswordResetRequestSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    uid = serializers.CharField()
    token = serializers.CharField()
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate(self, attrs):
        try:
            user_id = urlsafe_base64_decode(attrs["uid"]).decode()
            user = User.objects.get(pk=user_id)
        except (User.DoesNotExist, ValueError, TypeError, OverflowError):
            raise serializers.ValidationError({"uid": "Lien de réinitialisation invalide."})

        if not default_token_generator.check_token(user, attrs["token"]):
            raise serializers.ValidationError({"token": "Ce lien de réinitialisation est invalide ou a expiré."})

        attrs["user"] = user
        return attrs

    def save(self, **kwargs):
        user = self.validated_data["user"]
        user.set_password(self.validated_data["new_password"])
        user.save(update_fields=["password"])
        return user
