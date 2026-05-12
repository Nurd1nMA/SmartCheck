import { createContext, useContext, useState } from 'react';

const AuthContext = createContext(null);

const STORAGE_KEY = 'sc_user_v2'; // новый ключ — сбрасывает старые сломанные сессии

function readStorage() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Базовая валидация — должен быть объект с id и email
    if (parsed && typeof parsed === 'object' && parsed.id && parsed.email) return parsed;
    return null;
  } catch {
    localStorage.removeItem(STORAGE_KEY);
    return null;
  }
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => readStorage());

  const login = (userData) => {
    // Нормализуем email перед сохранением
    const normalized = { ...userData, email: userData.email?.trim().toLowerCase() };
    setUser(normalized);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(normalized)); }
    catch { /* storage full — ignore */ }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateProfile = (data) => {
    const updated = { ...user, ...data };
    setUser(updated);
    try { localStorage.setItem(STORAGE_KEY, JSON.stringify(updated)); }
    catch { /* ignore */ }
  };

  const role          = user?.role;
  const isAdmin       = role === 'admin';
  const isDoctor      = role === 'doctor';
  const isNurse       = role === 'nurse';
  const canEdit       = isAdmin || isDoctor;   // create / edit patients & rooms
  const canDelete     = isAdmin;               // delete patients, rooms
  const canManageUsers = isAdmin;              // delete users, change roles

  return (
    <AuthContext.Provider value={{
      user,
      login,
      logout,
      updateProfile,
      isAdmin,
      isDoctor,
      isNurse,
      canEdit,
      canDelete,
      canManageUsers,
    }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);