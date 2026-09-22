# Corporate IS — Lab 1

Лабораторная работа №1: Django + PostgreSQL + Docker Compose.

## Что сделано

- Django-проект с приложением `employees`
- Модель `Employee` (ФИО, должность, дата найма)
- Django подключён к PostgreSQL через Docker Compose
- Модель зарегистрирована в admin panel, добавлены тестовые записи

## Как запустить

1. Активировать виртуальное окружение: `venv\Scripts\Activate.ps1`
2. Поднять базу данных: `docker compose up -d`
3. Применить миграции: `python manage.py migrate`
4. Запустить сервер: `python manage.py runserver`
5. Открыть админку: http://127.0.0.1:8000/admin/

## Идея мини-ИС для итогового проекта

CRM для отдела продаж: учёт клиентов, сделок, сотрудников, отчёты по продажам.

## Технические детали

- PostgreSQL 16 в Docker, порт хоста 5434 (5432–5433 заняты локальными PostgreSQL)
- Драйвер: `psycopg` (v3)
- Пароли хранятся в `.env` (не в Git)