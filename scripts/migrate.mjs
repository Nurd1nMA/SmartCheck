/**
 * Миграция db.json → Supabase
 * Запуск: node scripts/migrate.mjs
 * (сначала заполни .env файл)
 */
import { createClient } from '@supabase/supabase-js';
import { readFileSync }  from 'fs';

// ── Читаем .env ───────────────────────────────────────
const env = {};
try {
  readFileSync('.env', 'utf-8').split('\n').forEach(line => {
    const [key, ...rest] = line.split('=');
    if (key?.trim()) env[key.trim()] = rest.join('=').trim();
  });
} catch {
  console.error('Файл .env не найден. Создай его и заполни ключи Supabase.');
  process.exit(1);
}

const { VITE_SUPABASE_URL: URL, VITE_SUPABASE_ANON_KEY: KEY } = env;

if (!URL || URL.includes('ВСТАВЬ') || !KEY || KEY.includes('ВСТАВЬ')) {
  console.error('Заполни VITE_SUPABASE_URL и VITE_SUPABASE_ANON_KEY в файле .env');
  process.exit(1);
}

// ── Читаем db.json ────────────────────────────────────
const db = JSON.parse(readFileSync('./db.json', 'utf-8'));
const supabase = createClient(URL, KEY);

// ── Мигрируем ─────────────────────────────────────────
async function migrate(table, rows) {
  if (!rows?.length) { console.log(`  ⏭  ${table}: нет данных`); return; }
  console.log(`  ⬆  ${table}: ${rows.length} записей...`);
  const { error } = await supabase.from(table).upsert(rows, { onConflict: 'id' });
  if (error) console.error(`  ✗  Ошибка: ${error.message}`);
  else       console.log(`  ✓  ${table}: готово`);
}

console.log('\n🚀 Миграция db.json → Supabase\n');
await migrate('users',    db.users);
await migrate('patients', db.patients);
await migrate('rooms',    db.rooms);
console.log('\n✅ Миграция завершена!\n');
