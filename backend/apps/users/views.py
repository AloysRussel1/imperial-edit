import logging

from django.conf import settings
from django.contrib.auth.tokens import default_token_generator
from django.utils.encoding import force_bytes
from django.utils.http import urlsafe_base64_encode
from rest_framework import generics, permissions, status
from rest_framework.response import Response
from rest_framework.views import APIView
from rest_framework_simplejwt.views import TokenObtainPairView

from .models import User
from .serializers import (
    ImperialTokenObtainPairSerializer,
    PasswordResetConfirmSerializer,
    PasswordResetRequestSerializer,
    RegisterSerializer,
    UserSerializer,
)
from .tasks import send_password_reset_email, send_welcome_email

logger = logging.getLogger(__name__)


class ImperialTokenObtainPairView(TokenObtainPairView):
    serializer_class = ImperialTokenObtainPairSerializer


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    serializer_class = RegisterSerializer
    permission_classes = (permissions.AllowAny,)

    def perform_create(self, serializer):
        user = serializer.save()
        # CELERY_TASK_ALWAYS_EAGER (Render, plan gratuit) exécute `.delay()` de
        # façon synchrone, avec propagation des exceptions (voir
        # settings/production.py) : sans ce filet, un e-mail de bienvenue en
        # échec (SMTP, template...) ferait échouer toute l'inscription alors
        # que le compte a déjà été créé en base — c'était la cause du "Inscription
        # impossible pour le moment" en production malgré un compte bien créé.
        try:
            send_welcome_email.delay(user.email, user.first_name)
        except Exception:
            logger.exception("Échec de l'envoi de l'e-mail de bienvenue à %s", user.email)


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
