from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from rest_framework.test import APITestCase

from catalog.models import Category, Product
from orders.models import Order

User = get_user_model()


class OrderApiTests(APITestCase):
    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Книги", slug="books")
        cls.book = Product.objects.create(
            category=category,
            name="Чистый код",
            slug="clean-code",
            sku="BK-1",
            price=Decimal("1000"),
            stock=5,
        )
        cls.buyer = User.objects.create_user("buyer", password="pass12345")
        cls.other = User.objects.create_user("other", password="pass12345")
        cls.manager = User.objects.create_user("manager", password="pass12345", is_staff=True)
        call_command("setup_groups", stdout=open("/dev/null", "w"))
        cls.manager.groups.add(Group.objects.get(name="Менеджеры магазина"))

    def buy(self, user):
        self.client.force_authenticate(user)
        self.client.post("/api/cart/items/", {"product": self.book.pk, "quantity": 1})
        response = self.client.post(
            "/api/orders/",
            {
                "full_name": "Покупатель",
                "phone": "8 (913) 000-00-00",
                "email": "b@example.com",
                "delivery_method": "pickup",
            },
        )
        self.assertEqual(response.status_code, 201, response.data)
        return response.data["id"]

    def test_anonymous_gets_401(self):
        self.assertEqual(self.client.get("/api/orders/").status_code, 401)
        self.assertEqual(self.client.get("/api/catalog/products/").status_code, 200)

    def test_jwt_login_and_create_order(self):
        tokens = self.client.post(
            "/api/auth/token/", {"username": "buyer", "password": "pass12345"}
        ).data
        self.client.credentials(HTTP_AUTHORIZATION=f"Bearer {tokens['access']}")
        cart = self.client.post("/api/cart/items/", {"product": self.book.pk, "quantity": 2}).data
        self.assertEqual(cart["total"], "2000.00")

        response = self.client.post(
            "/api/orders/",
            {
                "full_name": "Покупатель",
                "phone": "8 (913) 000-00-00",
                "email": "b@example.com",
                "delivery_method": "courier",
            },
        )
        self.assertEqual(response.status_code, 400)  # курьер без адреса

        response = self.client.post(
            "/api/orders/",
            {
                "full_name": "Покупатель",
                "phone": "8 (913) 000-00-00",
                "email": "b@example.com",
                "delivery_method": "courier",
                "address": "ул. Каменская, 56",
            },
        )
        self.assertEqual(response.status_code, 201)
        self.assertEqual(response.data["total"], "2500.00")
        self.assertEqual(response.data["phone"], "+79130000000")

    def test_customer_sees_only_own_orders(self):
        own = self.buy(self.buyer)
        self.buy(self.other)
        self.client.force_authenticate(self.buyer)
        ids = [order["id"] for order in self.client.get("/api/orders/").data["results"]]
        self.assertEqual(ids, [own])

    def test_only_manager_can_change_status(self):
        order_id = self.buy(self.buyer)
        url = f"/api/orders/{order_id}/status/"

        self.client.force_authenticate(self.buyer)
        self.assertEqual(self.client.post(url, {"status": "confirmed"}).status_code, 403)

        self.client.force_authenticate(self.manager)
        self.assertEqual(len(self.client.get("/api/orders/").data["results"]), 1)
        response = self.client.post(url, {"status": "confirmed", "comment": "Позвонили"})
        self.assertEqual(response.status_code, 200)
        self.assertEqual(Order.objects.get().status, "confirmed")
        self.assertEqual(self.client.post(url, {"status": "new"}).status_code, 400)

    def test_employees_api_is_closed_for_customers(self):
        self.client.force_authenticate(self.buyer)
        self.assertEqual(self.client.get("/api/employees/").status_code, 403)
