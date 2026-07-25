from rest_framework import serializers

from .models import SourcingRequest


class SourcingRequestSerializer(serializers.ModelSerializer):
    customer_name = serializers.SerializerMethodField()
    customer_email = serializers.CharField(source="customer.email", read_only=True)
    customer_whatsapp = serializers.CharField(source="customer.whatsapp_number", read_only=True)

    class Meta:
        model = SourcingRequest
        fields = (
            "id",
            "customer",
            "customer_name",
            "customer_email",
            "customer_whatsapp",
            "product_name",
            "category",
            "size_or_shoe",
            "budget_max_xaf",
            "reference_image",
            "source_url",
            "description",
            "status",
            "quoted_price_xaf",
            "admin_notes",
            "converted_order",
            "created_at",
        )
        read_only_fields = ("customer", "status", "quoted_price_xaf", "admin_notes", "converted_order")

    def get_customer_name(self, obj: SourcingRequest) -> str:
        return f"{obj.customer.first_name} {obj.customer.last_name}".strip() or obj.customer.email


class CreateSourcingRequestSerializer(serializers.ModelSerializer):
    class Meta:
        model = SourcingRequest
        fields = (
            "product_name",
            "category",
            "size_or_shoe",
            "budget_max_xaf",
            "reference_image",
            "source_url",
            "description",
        )


class QuoteSourcingRequestSerializer(serializers.Serializer):
    quoted_price_xaf = serializers.DecimalField(max_digits=12, decimal_places=2)
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class RejectSourcingRequestSerializer(serializers.Serializer):
    admin_notes = serializers.CharField(required=False, allow_blank=True)


class ConvertSourcingRequestSerializer(serializers.Serializer):
    deposit_percentage = serializers.ChoiceField(choices=[50, 70, 100])
    shipping_address = serializers.CharField()
    delivery_city = serializers.CharField()
