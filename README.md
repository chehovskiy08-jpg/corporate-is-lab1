# Corporate IS — Lab 2

Django + PostgreSQL + DRF REST API.

## Что сделано

- Модель `Department` (name, description)
- Модель `Employee` связана с `Department` через ForeignKey (on_delete=SET_NULL)
- Модель `Employee` зарегистрирована в admin panel с `list_display` и `list_filter`
- Установлен и подключён Django REST Framework
- REST API для `employees` и `departments` через ModelViewSet + DefaultRouter

## Как запустить

1. Активировать виртуальное окружение:
venv\Scripts\Activate.ps1

2. Поднять базу данных:
docker compose up -d

3. Применить миграции:
python manage.py migrate

4. Запустить сервер:
python manage.py runserver

5. Открыть админку: http://127.0.0.1:8000/admin/
6. Открыть API: http://127.0.0.1:8000/api/

## REST API эндпоинты

| Метод | URL | Описание |
|---|---|---|
| GET | `/api/employees/` | Список сотрудников |
| POST | `/api/employees/` | Создать сотрудника |
| GET | `/api/employees/<id>/` | Один сотрудник |
| PATCH | `/api/employees/<id>/` | Частичное обновление |
| DELETE | `/api/employees/<id>/` | Удалить |
| GET | `/api/departments/` | Список отделов |
| POST | `/api/departments/` | Создать отдел |

## Примеры запросов

Получить список сотрудников:
curl http://127.0.0.1:8000/api/employees/


Создать нового сотрудника:
curl -X POST http://127.0.0.1:8000/api/employees/
-H "Content-Type: application/json"
-d '{"full_name": "Иванова Анна", "position": "Менеджер", "hired_at": "2026-09-15", "department": 1}'


## Технические детали

- PostgreSQL 16 в Docker, порт хоста **5434** (5432–5433 заняты локальными PostgreSQL)
- Драйвер БД: `psycopg` (v3)
- Пароли в `.env` (не в Git)
- Django REST Framework для API
- Командный workflow через feature-ветки и Pull Request

## Идея мини-ИС для итогового проекта

CRM для отдела продаж: клиенты, сделки, сотрудники, отделы, отчёты.