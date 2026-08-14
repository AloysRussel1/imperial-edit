import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import EmailVerificationOTP, User
from .serializers import (
    ImperialTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    ResendOTPSerializer,
    UserSerializer,
    VerifyEmailSerializer,
)
from .tasks import send_otp_email, send_password_reset_email, send_welcome_email

logger = logging.getLogger(__name__)


class ImperialTokenObtainPairView(TokenObtainPairView):
    serializer_class = ImperialTokenObtainPairSerializer


def _issue_otp(user: User) -> None:
    # Tout englobé (création en base ET envoi) : un échec à n'importe quelle
    # étape — écriture DB, rendu de template, service e-mail en panne —
    # ne doit jamais faire échouer l'inscription ou le renvoi de code
    # eux-mêmes, le compte existe déjà en base à ce stade.
    try:
        otp = EmailVerificationOTP.objects.create(user=user)
        send_otp_email.delay(user.email, user.first_name, otp.code)
    except Exception:
        logger.exception("Échec de l'émission du code de vérification à %s", user.email)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def perform_create(self, serializer):
        user = serializer.save()
        try:
            send_welcome_email.delay(user.email, user.first_name)
        except Exception:
            logger.exception("Échec de l'envoi de l'e-mail de bienvenue à %s", user.email)
        _issue_otp(user)


class VerifyEmailView(APIView):
    """Active le compte (is_active=True) une fois le code OTP validé, et
    renvoie directement une session JWT — l'inscription redevient "inscription
    = déjà connecté" dès que l'adresse est confirmée, sans étape de login
    supplémentaire côté client."""

    permission_classes = (permissions.AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "otp-verify"

    def post(self, request):
        serializer = VerifyEmailSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()

        refresh_token = ImperialTokenObtainPairSerializer.get_token(user)
        return Response(
            {
                "detail": "Adresse e-mail vérifiée avec succès.",
                "access": str(refresh_token.access_token),
                "refresh": str(refresh_token),
            },
            status=status.HTTP_200_OK,
        )


class ResendOTPView(APIView):
    """Réponse volontairement générique (jamais de 404/400 révélant qu'un
    compte n'existe pas) — seul le cooldown/l'e-mail déjà vérifié remontent
    une erreur, car ce sont des cas où l'utilisateur agit sur SON PROPRE
    compte et a donc déjà légitimement connaissance de son état."""

    permission_classes = (permissions.AllowAny,)
    throttle_classes = (ScopedRateThrottle,)
    throttle_scope = "otp-resend"

    def post(self, request):
        serializer = ResendOTPSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user is not None and not user.is_email_verified:
            _issue_otp(user)

        return Response({"detail": "Un nouveau code de vérification vient d'être envoyé."})


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = (permissions.IsAuthenticated,)

    def get_object(self):
        return self.request.user


class PasswordResetRequestView(APIView):
    """
    Point d'entrée public du flux "mot de passe oublié". Renvoie toujours la
    même réponse générique, que l'e-mail corresponde à un compte ou non — ne
    jamais révéler l'existence d'un compte à partir de cet endpoint.
    """

    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetRequestSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        user = User.objects.filter(email__iexact=serializer.validated_data["email"]).first()
        if user is not None:
            uid = urlsafe_base64_encode(force_bytes(user.pk))
            token = default_token_generator.make_token(user)
            reset_url = f"{settings.FRONTEND_URL}/reset-password?uid={uid}&token={token}"
            try:
                send_password_reset_email.delay(user.email, reset_url)
            except Exception:
                logger.exception("Échec de l'envoi de l'e-mail de réinitialisation à %s", user.email)

        return Response(
            {"detail": "Si un compte existe avec cet e-mail, un lien de réinitialisation vient d'être envoyé."}
        )


class PasswordResetConfirmView(APIView):
    permission_classes = (permissions.AllowAny,)

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        serializer.save()
        return Response({"detail": "Mot de passe mis à jour avec succès."}, status=status.HTTP_200_OK)
