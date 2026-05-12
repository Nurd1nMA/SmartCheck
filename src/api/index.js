import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL,
  import.meta.env.VITE_SUPABASE_ANON_KEY
);

// Оборачивает ответ Supabase в { data } — совместимо с useFetch
async function q(promise) {
  const { data, error } = await promise;
  if (error) throw new Error(error.message);
  return { data };
}

// ── Patients ──────────────────────────────────────────
export const getPatients   = ()         => q(supabase.from('patients').select('*').order('name'));
export const getPatient    = (id)       => q(supabase.from('patients').select('*').eq('id', id).single());
export const createPatient = (data)     => q(supabase.from('patients').insert(data).select().single());
export const updatePatient = (id, data) => q(supabase.from('patients').update(data).eq('id', id).select().single());
export const deletePatient = (id)       => q(supabase.from('patients').delete().eq('id', id));

// ── Users ─────────────────────────────────────────────
export const getUsers   = ()         => q(supabase.from('users').select('*').order('name'));
export const getUser    = (id)       => q(supabase.from('users').select('*').eq('id', id).single());
export const updateUser = (id, data) => q(supabase.from('users').update(data).eq('id', id).select().single());
export const deleteUser = (id)       => q(supabase.from('users').delete().eq('id', id));

// ── Rooms ─────────────────────────────────────────────
export const getRooms    = ()         => q(supabase.from('rooms').select('*').order('name'));
export const getRoom     = (id)       => q(supabase.from('rooms').select('*').eq('id', id).single());
export const createRoom  = (data)     => q(supabase.from('rooms').insert(data).select().single());
export const updateRoom  = (id, data) => q(supabase.from('rooms').update(data).eq('id', id).select().single());
export const deleteRoom  = (id)       => q(supabase.from('rooms').delete().eq('id', id));

// ── Auth ──────────────────────────────────────────────
export const loginUser = async (email, password) => {
  const { data, error } = await supabase
    .from('users')
    .select('*')
    .ilike('email', email.trim());

  if (error) throw new Error('Ошибка подключения к серверу');

  const user = (data || []).find(
    (u) =>
      u.email.trim().toLowerCase() === email.trim().toLowerCase() &&
      u.password === password
  );

  if (!user) throw new Error('Неверный email или пароль');
  return user;
};

export const registerUser = async (userData) => {
  const { data: existing } = await supabase
    .from('users')
    .select('id')
    .ilike('email', userData.email.trim());

  if (existing && existing.length > 0) {
    throw new Error('Пользователь с таким email уже существует');
  }

  const newUser = {
    ...userData,
    email: userData.email.trim().toLowerCase(),
    name:  userData.name.trim(),
    role:  'nurse',
    id:    Date.now().toString(),
  };

  const { data, error } = await supabase.from('users').insert(newUser).select().single();
  if (error) throw new Error(error.message);
  return data;
};
