import pytest
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient


@pytest.mark.django_db
def test_customer_can_register():
    client = APIClient()
    payload = {
        "email": "client@example.com",
        "password": "S3cure-Pass!",
        "first_name": "Aïcha",
        "last_name": "Ngono",
        "phone_number": "+237600000000",
    }
    response = client.post(reverse("users:register"), payload)
    assert response.status_code == status.HTTP_201_CREATED
