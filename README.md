# SmartCheck — Медицинская система управления

Веб-приложение для управления пациентами, палатами и выдачей препаратов в клинике.

🔗 **[Демо](https://smart-check-rho.vercel.app)**

---

## Возможности

- **Пациенты** — карточки с диагнозом, лечащим врачом, статусом и назначениями
- **Препараты** — выдача с отслеживанием количества приёмов в день
- **Палаты** — управление палатами с QR-кодами (ссылка на страницу палаты)
- **Роли** — Admin / Врач / Медсестра с разными правами доступа
- **Admin Panel** — управление пользователями, статистика
- **Тёмная тема** — переключатель в шапке, сохраняется между сессиями
- **Мобильная версия** — адаптивный интерфейс с нижней навигацией

## Роли и права

| Действие | Медсестра | Врач | Admin |
|---|:---:|:---:|:---:|
| Просмотр пациентов и палат | ✅ | ✅ | ✅ |
| Выдача препаратов | ✅ | ✅ | ✅ |
| Создание / редактирование пациентов | ❌ | ✅ | ✅ |
| Удаление пациентов и палат | ❌ | ❌ | ✅ |
| Создание / редактирование палат | ❌ | ✅ | ✅ |
| Admin Panel (просмотр) | ❌ | ✅ | ✅ |
| Управление пользователями | ❌ | ❌ | ✅ |

## Стек

- **Frontend** — React 18, React Router v6, Vite 5
- **База данных** — Supabase (PostgreSQL)
- **QR-коды** — qrcode.react
- **Деплой** — Vercel

---

## Локальный запуск

### 1. Клонировать репозиторий

```bash
git clone https://github.com/Nurd1nMA/SmartCheck.git
cd SmartCheck
```

### 2. Установить зависимости

```bash
npm install
```

### 3. Настроить переменные окружения

Создай файл `.env` в корне проекта:

```
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

Получить ключи: [supabase.com](https://supabase.com) → Settings → API Keys

### 4. Создать таблицы в Supabase

Запусти содержимое файла [`scripts/schema.sql`](scripts/schema.sql) в Supabase SQL Editor.

### 5. Запустить

```bash
npm run dev
```

Приложение откроется на `http://localhost:5173`

---

## Деплой на Vercel

1. Запушить репозиторий на GitHub
2. Импортировать проект на [vercel.com](https://vercel.com)
3. Добавить переменные окружения (`VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`)
4. Deploy

---

## Демо-аккаунты

| Роль | Email | Пароль |
|---|---|---|
| Admin | admin@clinic.com | admin123 |
| Врач | doctor@clinic.uz | 123456 |

---

## Структура проекта

```
src/
├── api/          # Supabase запросы
├── components/   # Layout, PatientForm, ProtectedRoute
├── context/      # AuthContext (авторизация + роли)
├── hooks/        # useFetch, useDebounce
├── pages/        # Dashboard, Patients, Rooms, AdminPanel, Profile
└── index.css     # Стили + тёмная тема
scripts/
├── schema.sql    # SQL схема для Supabase
└── migrate.mjs   # Миграция данных из db.json → Supabase
```
