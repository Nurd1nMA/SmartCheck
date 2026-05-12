-- ──────────────────────────────────────────────────────
-- SmartCheck — Supabase schema
-- Запусти этот файл в Supabase SQL Editor
-- ──────────────────────────────────────────────────────

-- Таблица пользователей
CREATE TABLE IF NOT EXISTS users (
  id          text PRIMARY KEY,
  name        text NOT NULL DEFAULT '',
  email       text UNIQUE NOT NULL,
  password    text NOT NULL DEFAULT '',
  role        text NOT NULL DEFAULT 'nurse',
  department  text NOT NULL DEFAULT '',
  phone       text NOT NULL DEFAULT ''
);

-- Таблица пациентов
CREATE TABLE IF NOT EXISTS patients (
  id             text PRIMARY KEY,
  name           text NOT NULL DEFAULT '',
  age            integer NOT NULL DEFAULT 0,
  room           text NOT NULL DEFAULT '',
  "bloodType"    text NOT NULL DEFAULT '',
  diagnosis      text NOT NULL DEFAULT '',
  phone          text NOT NULL DEFAULT '',
  allergies      text NOT NULL DEFAULT '',
  doctor         text NOT NULL DEFAULT '',
  "admittedDate" text NOT NULL DEFAULT '',
  status         text NOT NULL DEFAULT 'active',
  medications    jsonb NOT NULL DEFAULT '[]'
);

-- Таблица палат
CREATE TABLE IF NOT EXISTS rooms (
  id          text PRIMARY KEY,
  name        text NOT NULL UNIQUE,
  floor       text NOT NULL DEFAULT '',
  capacity    integer NOT NULL DEFAULT 4,
  description text NOT NULL DEFAULT '',
  "createdAt" text NOT NULL DEFAULT ''
);

-- ── Row Level Security ────────────────────────────────
-- Разрешаем все операции через anon key
-- (авторизация реализована на уровне приложения)

ALTER TABLE users    ENABLE ROW LEVEL SECURITY;
ALTER TABLE patients ENABLE ROW LEVEL SECURITY;
ALTER TABLE rooms    ENABLE ROW LEVEL SECURITY;

CREATE POLICY "allow all" ON users    FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON patients FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "allow all" ON rooms    FOR ALL USING (true) WITH CHECK (true);
