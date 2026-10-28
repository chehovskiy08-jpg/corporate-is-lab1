from django.db import connection
from django.http import JsonResponse

from config import __version__


def healthz(request):
    """Проверка живости для docker healthcheck и балансировщика: приложение и база отвечают."""
    with connection.cursor() as cursor:
        cursor.execute("SELECT 1")
    return JsonResponse({"status": "ok", "version": __version__})
