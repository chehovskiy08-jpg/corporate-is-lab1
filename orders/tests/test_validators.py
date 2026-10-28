from django.core.exceptions import ValidationError
from django.test import SimpleTestCase

from orders.validators import normalize_phone


class NormalizePhoneTests(SimpleTestCase):
    def test_different_formats_give_one_result(self):
        for raw in ["+7 913 123-45-67", "8 (913) 123-45-67", "89131234567", "9131234567"]:
            with self.subTest(raw=raw):
                self.assertEqual(normalize_phone(raw), "+79131234567")

    def test_garbage_is_rejected(self):
        for raw in ["123", "+1 202 555 0100", "телефон"]:
            with self.subTest(raw=raw), self.assertRaises(ValidationError):
                normalize_phone(raw)
