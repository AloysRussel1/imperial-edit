import pytest
from django.core.files.uploadedfile import SimpleUploadedFile

from apps.sourcing.models import SourcingStatus
from apps.sourcing.services import convert_to_order, quote_sourcing_request, submit_sourcing_request
from apps.users.models import User


@pytest.mark.django_db
def test_quoted_request_can_be_converted_to_order():
    customer = User.objects.create_user(username="s@example.com", email="s@example.com", password="pass")
    image = SimpleUploadedFile("bag.jpg", b"fake-image-bytes", content_type="image/jpeg")
    req = submit_sourcing_request(customer=customer, reference_image=image, source_url="https://instagram.com/p/xyz")

    req = quote_sourcing_request(req, quoted_price_xaf=180000)
    assert req.status == SourcingStatus.QUOTED

    order = convert_to_order(req, deposit_percentage=70, shipping_address="Yaoundé", delivery_city="Yaoundé")
    assert order.total_xaf == 180000
    assert order.deposit_percentage == 70
