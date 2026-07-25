import pytest

from apps.orders.models import DepositOption, OrderStatus
from apps.orders.services import create_order_from_cart, register_payment
from apps.products.models import Category, Product, ProductVariant
from apps.orders.models import Cart, CartItem
from apps.users.models import User


@pytest.mark.django_db
def test_deposit_payment_marks_order_as_deposit_paid():
    customer = User.objects.create_user(username="c@example.com", email="c@example.com", password="pass")
    category = Category.objects.create(name="Chaussures", slug="chaussures")
    product = Product.objects.create(
        category=category, product_type="shoes", name="Escarpins", slug="escarpins", base_price_xaf=100000
    )
    variant = ProductVariant.objects.create(product=product, sku="SHOE-001", size="40", stock_quantity=5)
    cart = Cart.objects.create(customer=customer)
    CartItem.objects.create(cart=cart, variant=variant, quantity=1)

    order = create_order_from_cart(
        cart=cart,
        deposit_percentage=DepositOption.HALF,
        shipping_address="Douala",
        delivery_city="Douala",
    )
    order = register_payment(order, order.deposit_due_xaf)

    assert order.status == OrderStatus.DEPOSIT_PAID
    assert order.amount_remaining_xaf == order.total_xaf - order.deposit_due_xaf
