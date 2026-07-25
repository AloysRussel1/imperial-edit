from rest_framework import serializers

from .models import Transaction


class TransactionSerializer(serializers.ModelSerializer):
    payment_url = serializers.SerializerMethodField()

    class Meta:
        model = Transaction
        fields = (
            "id",
            "order",
            "provider",
            "purpose",
            "status",
            "amount_xaf",
            "provider_reference",
            "payer_phone_number",
            "payment_url",
            "created_at",
        )
        read_only_fields = ("status",)

    def get_payment_url(self, obj: Transaction) -> str:
        return obj.raw_payload.get("payment_url", "") if obj.raw_payload else ""


class InitiatePaymentSerializer(serializers.Serializer):
    order_id = serializers.UUIDField()
    provider = serializers.ChoiceField(choices=["cinetpay", "flutterwave", "sandbox"], default="cinetpay")
    purpose = serializers.ChoiceField(choices=["deposit", "balance", "full"])
    payment_method = serializers.ChoiceField(choices=["mtn_momo", "orange_money", "card"], required=False)
    payer_phone_number = serializers.CharField(required=False, allow_blank=True)


class WebhookEventSerializer(serializers.Serializer):
    provider = serializers.ChoiceField(choices=["cinetpay", "flutterwave", "sandbox"])
    reference = serializers.CharField()
    status = serializers.CharField()
