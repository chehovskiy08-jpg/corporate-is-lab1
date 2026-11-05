# Правила проекта для ИИ-ассистентов

Магазин: Django 6.1 + DRF + PostgreSQL 16 (`backend` в корне репозитория), фронтенд — React 19 + TypeScript в `frontend/`. Всё запускается через `docker compose up`.

## Бэкенд
- Бизнес-логика — в `services.py` или методах моделей, не во view. Операции с несколькими объектами — `transaction.atomic`, где возможна гонка — `select_for_update`.
- API: «запрещено всё, что не разрешено» (`IsAuthenticated` по умолчанию), открытые адреса — явно `AllowAny`.
- Любое изменение API сопровождается обновлением схемы: `manage.py spectacular --validate --fail-on-warn` без предупреждений.
- Тесты: `docker compose exec web python manage.py test --settings=config.settings.test`.

## Фронтенд
- Пакет маршрутизации — `react-router` версии 8 (пакета `react-router-dom` больше нет), режим данных: `createBrowserRouter`.
- Серверные данные — только через TanStack Query v5 (`queryOptions`, объектный синтаксис `useQuery({ queryKey, queryFn })`). Не загружать данные в `useEffect`.
- Типы API не писать руками: `npm run api:types` генерирует `src/api/schema.d.ts`, запросы — через типизированный клиент `api` из `src/api/client.ts`.
- Без `any`. Деньги приходят строками (`"1390.00"`): число — только для показа, суммы считает сервер.
- Проверка перед коммитом: `npm run typecheck`, `npm run lint`, `npm test`.
