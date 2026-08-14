from django.contrib.auth.password_validation import validate_password
from django.contrib.auth.tokens import default_token_generator
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


# Rôles sélectionnables par un visiteur à l'inscription — jamais "admin" :
# un compte admin obtient au passage `is_staff=True` (voir User.save) et
# l'accès complet au backoffice Django, ce qui en ferait une élévation de
# privilège triviale si ce champ acceptait n'importe quelle valeur du modèle.
REGISTRABLE_ROLES = (UserRole.CUSTOMER, UserRole.VENDOR)


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    role = serializers.ChoiceField(choices=[(r.value, r.label) for r in REGISTRABLE_ROLES], default=UserRole.CUSTOMER)

    class Meta:
        model = User
        fields = ("email", "password", "first_name", "last_name", "phone_number", "whatsapp_number", "city", "role")

    def create(self, validated_data):
        password = validated_data.pop("password")
        # Compte créé inactif : reste inutilisable pour se connecter (voir
        # EmailOrUsernameModelBackend, qui rejette is_active=False) tant que
        # le code OTP envoyé par e-mail n'a pas été validé — voir
        # VerifyEmailSerializer et RegisterView.perform_create.
        user = User(username=validated_data["email"], is_active=False, **validated_data)
        user.set_password(password)
        user.save()
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
