import tempfile
from decimal import Decimal

from django.contrib.auth import get_user_model
from django.contrib.auth.models import Group
from django.core.management import call_command
from django.test import SimpleTestCase
from rest_framework.test import APITestCase

from catalog.models import Category, Product

User = get_user_model()

CHECKOUT = {"full_name": "Анна", "phone": "+7 913 000-00-00", "email": "a@example.com"}


class SpaApiTests(APITestCase):
    """API, которое добавлено для React-фронтенда в лабораторной №9."""

    @classmethod
    def setUpTestData(cls):
        category = Category.objects.create(name="Книги", slug="books")
        cls.book = Product.objects.create(
            category=category,
            name="Канбан",
            slug="kanban",
            sku="BK-1",
            price=Decimal("990"),
            stock=3,
        )
        cls.hidden = Product.objects.create(
            category=category,
            name="Снят",
            slug="old",
            sku="BK-2",
            price=1,
            stock=5,
            is_active=False,
        )
        cls.buyer = User.objects.create_user("buyer", password="pass12345")
        cls.manager = User.objects.create_user("manager", password="pass12345", is_staff=True)
        call_command("setup_groups", stdout=open("/dev/null", "w"))
        cls.manager.groups.add(Group.objects.get(name="Менеджеры магазина"))

    def test_register_validates_password_and_logs_in_with_token(self):
        weak = self.client.post(
            "/api/auth/register/",
            {"username": "ivan", "email": "i@example.com", "password": "123"},
        )
        self.assertEqual(weak.status_code, 400)
        self.assertIn("password", weak.data)
        ok = self.client.post(
            "/api/auth/register/",
            {"username": "ivan", "email": "i@example.com", "password": "Reactdjango2026"},
        )
        self.assertEqual(ok.status_code, 201)
        self.assertNotIn("password", ok.data)
        token = self.client.post(
            "/api/auth/token/", {"username": "ivan", "password": "Reactdjango2026"}
        )
        self.assertEqual(token.status_code, 200)

    def test_me_shows_role(self):
        self.client.force_authenticate(self.buyer)
        self.assertFalse(self.client.get("/api/auth/me/").data["is_manager"])
        self.client.force_authenticate(self.manager)
        self.assertTrue(self.client.get("/api/auth/me/").data["is_manager"])

    def test_merge_adds_guest_items_skips_hidden_and_respects_stock(self):
        self.client.force_authenticate(self.buyer)
        self.client.post("/api/cart/items/", {"product": self.book.pk, "quantity": 2})
        response = self.client.post(
            "/api/cart/merge/",
            {
                "items": [
                    {"product": self.book.pk, "quantity": 2},
                    {"product": self.hidden.pk, "quantity": 1},
                ]
            },
            format="json",
        )
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data["items"]), 1)
        item = response.data["items"][0]
        self.assertEqual(item["quantity"], 3)  # 2 + 2, но на складе только 3
        self.assertEqual(item["slug"], "kanban")

    def test_checkout_without_delivery_method_is_400_not_500(self):
        self.client.force_authenticate(self.buyer)
        self.client.post("/api/cart/items/", {"product": self.book.pk})
        response = self.client.post("/api/orders/", CHECKOUT)
        self.assertEqual(response.status_code, 400)
        self.assertIn("delivery_method", response.data)

    def test_allowed_transitions_only_for_manager(self):
        self.client.force_authenticate(self.buyer)
        self.client.post("/api/cart/items/", {"product": self.book.pk})
        order = self.client.post("/api/orders/", {**CHECKOUT, "delivery_method": "pickup"}).data
        self.assertEqual(order["allowed_transitions"], [])
        self.assertTrue(order["can_cancel"])
        self.client.force_authenticate(self.manager)
        detail = self.client.get(f"/api/orders/{order['id']}/").data
        self.assertEqual(detail["allowed_transitions"], ["cancelled", "confirmed"])
        self.assertFalse(detail["can_cancel"])


class SchemaContractTests(SimpleTestCase):
    def test_openapi_schema_has_no_errors_or_warnings(self):
        with tempfile.NamedTemporaryFile(suffix=".yml") as schema:
            call_command(
                "spectacular",
                "--validate",
                "--fail-on-warn",
                "--file",
                schema.name,
                stdout=open("/dev/null", "w"),
            )
