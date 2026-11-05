# Corporate IS — интернет-магазин с CRM

Учебный проект: корпоративная информационная система с интернет-магазином и внутренней CRM. Проект развивался с Лабораторной №1 по №9.

## Стек

- **Бэкенд:** Python 3.13, Django 6.1, Django REST Framework, PostgreSQL 16, JWT (SimpleJWT), drf-spectacular (OpenAPI)
- **Фронтенд:** React 19, TypeScript, Vite, TanStack Query v5, React Router v8, React Hook Form + Zod
- **Инфраструктура:** Docker, Docker Compose, Nginx, Gunicorn, Mailpit
- **Тестирование:** Django TestCase, Vitest + Testing Library + MSW, Playwright
- **Инструменты:** Git (git-flow), pre-commit, ruff, oxlint

## Структура проекта
corporate-is-lab1/
├── accounts/ # кастомная модель User
├── cart/ # корзина
├── catalog/ # каталог (категории, товары, отзывы)
├── config/ # настройки Django
├── employees/ # CRM: отделы, сотрудники
├── orders/ # заказы, промокоды, статусы
├── frontend/ # React-приложение
├── nginx/ # конфигурация Nginx
├── docker/ # entrypoint, gunicorn.conf.py
├── templates/ # HTML-шаблоны (для админки)
├── docker-compose.yml # окружение разработки
├── docker-compose.prod.yml # продакшен-стенд
├── Dockerfile # multi-stage сборка
└── README.md

---

## Лабораторная №1: Настройка окружения, Django, PostgreSQL, Docker

- Установлены Git, Docker, Python, Node.js, PostgreSQL в контейнере.
- Создан Django-проект `config`, приложение `employees` с моделью `Employee`.
- База PostgreSQL поднята через Docker Compose.
- Первый коммит и push в репозиторий GitHub.

## Лабораторная №2: Git-workflow и Django REST Framework

- Освоен git-flow: feature-ветки, Pull Request, code review, squash merge.
- Добавлена модель `Department`, связь `Employee.department` через `ForeignKey`.
- Подключён DRF: сериализаторы, ViewSet'ы, маршруты для `/api/employees/` и `/api/departments/`.

## Лабораторная №3: Настройки, кастомный пользователь, логирование

- Настройки разделены на пакет `config/settings/`: `base.py`, `dev.py`, `prod.py`.
- Секреты (`SECRET_KEY`, `DATABASE_URL`, `ALLOWED_HOSTS`) вынесены в `.env` через `django-environ`.
- Создана кастомная модель `accounts.User` (наследник `AbstractUser`) с полями `phone` и `employee` (OneToOne на `Employee`).
- Настроен `LOGGING` с консольным выводом.
- Подключён `django-debug-toolbar`, найдена и исправлена проблема N+1 через `select_related`.

## Лабораторная №4: Docker, git-flow, pre-commit

- Создан multi-stage `Dockerfile` с этапами `base`, `dev`, `builder`, `prod`.
- Настроен `.dockerignore` (исключены `.env`, `venv`, `.git`).
- Разделены зависимости: `requirements/base.txt` и `requirements/dev.txt`.
- Настроен `pre-commit` с хуками `ruff`, `trailing-whitespace`, `end-of-file-fixer`.
- Внедрён git-flow: ветки `main` (релизы) и `develop` (разработка), защита от прямого push, только merge-коммиты.

## Лабораторная №5: Каталог магазина

- Создано приложение `catalog`: модели `Category` (дерево через `parent`), `Product`, `Review`.
- Полнотекстовый поиск PostgreSQL: `tsvector`, `tsquery`, `GeneratedField`, GIN-индексы, словарь `russian`.
- Поиск с опечатками через `TrigramWordSimilarity` (расширение `pg_trgm`).
- Фильтры и сортировка через `django-filter`.
- Admin-панель с автозаполнением slug, превью фото, модерацией отзывов.
- Команда `seed_catalog` для наполнения демо-данными.
- Витрина на HTML-шаблонах с пагинацией и фильтрами.
- REST API каталога: `/api/catalog/products/`, `/api/catalog/categories/`, отзывы.
- 12 тестов: поиск, фильтры, отзывы, ограничения, N+1.

## Лабораторная №6: Корзина, заказы, JWT

- Корзина в БД с поддержкой гостей (id в сессии) и слиянием при входе через сигнал `user_logged_in`.
- Модели заказов: `Order`, `OrderItem` (снимок цены), `PromoCode`, `OrderStatusLog`.
- Конечный автомат статусов (`Order.TRANSITIONS`): `new → confirmed → shipped → delivered`, отмена.
- Сервисный слой `orders/services.py`: `place_order` в транзакции с `select_for_update`, `F("stock") - n`, защита от гонок.
- Отправка писем через `transaction.on_commit` и Mailpit.
- Панель менеджера с ограниченными правами (группа «Менеджеры магазина»).
- JWT-аутентификация (`djangorestframework-simplejwt`): access (15 минут) и refresh (7 дней).
- `IsAuthenticated` по умолчанию, каталог явно `AllowAny`, `/api/employees/` закрыт через `StrictDjangoModelPermissions`.
- 37 тестов, покрытие 86% (сервис `orders/services.py` покрыт на 96%).

## Лабораторная №7: Продакшен-стенд и релизы

- Multi-stage Dockerfile с Gunicorn (prod) и runserver (dev).
- Nginx как reverse proxy с HTTPS (самоподписанный сертификат).
- Healthcheck `/healthz/` с проверкой БД.
- Отдельный сервис `migrate` с `service_completed_successfully`.
- Самоподписанный сертификат в `nginx/certs/` (не коммитится).
- Выпущен релиз **1.0.0** через `release/1.0.0` с тегом `v1.0.0`.
- Hotfix **1.0.1** через `hotfix/1.0.1` (нормализация телефона в заказах) с тегом `v1.0.1`.
- Резервное копирование БД через `pg_dump` / `pg_restore`.

## Лабораторная №8: React-каталог

- Подключён `drf-spectacular`: Swagger UI на `/api/docs/`, схема на `/api/schema/`.
- Создан фронтенд `frontend/` на Vite + React + TypeScript.
- Сервис `frontend` в `docker-compose.yml` с проксированием `/api` и `/media` на Django.
- Типы API генерируются из OpenAPI через `openapi-typescript` (`npm run api:types`).
- TanStack Query: `queryOptions`, `useQuery`, `keepPreviousData`, `prefetchQuery`.
- React Router в режиме данных (`createBrowserRouter`, загрузчики, `ErrorBoundary`, `HydrateFallback`).
- Каталог: дерево категорий, фильтры, поиск с debounce, пагинация, скелетоны.
- Карточка товара: предзагрузка при наведении, отзывы.
- AGENTS.md — правила для ИИ-ассистентов.
- 7 тестов Vitest + MSW.

## Лабораторная №9: Аутентификация, корзина, заказы на React

- API: регистрация, `/api/auth/me/` с `is_manager`, `/api/cart/merge/`.
- Позиции корзины со `slug` и картинкой; заказ без `delivery_method` возвращает 400.
- `allowed_transitions` и `can_cancel` в заказе (управляются сервером).
- JWT с обновлением одним запросом (middleware `openapi-fetch`), повтор запроса.
- Корзина гостя в `localStorage` через `useSyncExternalStore`, при входе переносится на сервер.
- Защита маршрутов в загрузчиках React Router (`requireUser`, `requireManager`).
- Формы входа, регистрации, оформления на React Hook Form + Zod с серверными ошибками.
- Оптимистичное обновление количества в корзине с откатом при ошибке.
- Раздел менеджера: смена статусов по `allowed_transitions`.
- E2E-тесты на Playwright (3 сценария: покупка, менеджер, права).
- 19 модульных тестов Vitest + 3 E2E.

---

## Быстрый старт

### Окружение разработки

```bash
# 1. Клонировать репозиторий
git clone https://github.com/chehovskiy08-jpg/corporate-is-lab1.git
cd corporate-is-lab1

# 2. Скопировать и заполнить .env
cp .env.example .env
# Отредактировать SECRET_KEY, POSTGRES_PASSWORD

# 3. Поднять контейнеры
docker compose up -d --build

# 4. Применить миграции и создать данные
docker compose exec web python manage.py migrate
docker compose exec web python manage.py seed_catalog --images
docker compose exec web python manage.py setup_groups
docker compose exec web python manage.py createsuperuser
Адреса:

Django API: http://localhost:8000/api/

Swagger UI: http://localhost:8000/api/docs/

Admin panel: http://localhost:8000/admin/

React: http://localhost:5173/

Mailpit: http://localhost:8025/

Фронтенд
bash
cd frontend
npm install
npm run dev
Продакшен-стенд
bash
# 1. Настроить .env.prod (из .env.prod.example)
cp .env.prod.example .env.prod

# 2. Сгенерировать SSL-сертификат (Git Bash)
openssl req -x509 -nodes -newkey rsa:2048 -days 365 \
  -keyout nginx/certs/localhost.key \
  -out nginx/certs/localhost.crt \
  -subj "//CN=localhost" \
  -addext "subjectAltName=DNS:localhost,IP:127.0.0.1"

# 3. Запустить
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
Адреса:

Сайт: https://localhost/ (принять самоподписанный сертификат)

Healthcheck: https://localhost/healthz/

Mailpit: http://localhost:8026/
