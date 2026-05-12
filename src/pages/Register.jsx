import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { registerUser } from '../api';
import { useAuth } from '../context/AuthContext';

// Объявлен ВНЕ компонента — React не пересоздаёт DOM-узел при каждом рендере
function Field({ value, onChange, error, label, type = 'text', placeholder, autoComplete }) {
  return (
    <div className="form-group">
      <label className="form-label">{label}</label>
      <input
        className={`form-input${error ? ' err' : ''}`}
        type={type}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
      />
      {error && <div className="field-error">{error}</div>}
    </div>
  );
}

export default function Register() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [form, setForm] = useState({
    name: '', email: '', password: '', password2: '', department: '', phone: '',
  });
  const [errors,   setErrors]   = useState({});
  const [loading,  setLoading]  = useState(false);
  const [apiError, setApiError] = useState('');

  const setF = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }));
    setErrors((prev) => ({ ...prev, [k]: '' }));
  };

  const validate = () => {
    const e = {};
    if (!form.name.trim())              e.name      = 'Введите ФИО';
    if (!form.email.includes('@'))      e.email     = 'Некорректный email';
    if (form.password.length < 6)       e.password  = 'Минимум 6 символов';
    if (form.password !== form.password2) e.password2 = 'Пароли не совпадают';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setApiError('');
    if (!validate()) return;
    setLoading(true);
    try {
      const user = await registerUser({
        name:       form.name.trim(),
        email:      form.email.trim(),
        password:   form.password,
        department: form.department.trim(),
        phone:      form.phone.trim(),
      });
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setApiError(err.message || 'Ошибка регистрации');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card" style={{ maxWidth: 480 }}>
        <div className="auth-logo">
          <div className="auth-logo-icon">＋</div>
          <span className="auth-logo-text">SmartCheck</span>
        </div>
        <h1 className="auth-title">Регистрация</h1>
        <p className="auth-subtitle">Создайте аккаунт для доступа к системе</p>

        {apiError && <div className="alert alert-error">{apiError}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <Field
            label="ФИО *" value={form.name} onChange={setF('name')}
            error={errors.name} placeholder="Иванов Иван Иванович"
            autoComplete="name"
          />
          <Field
            label="Email *" type="email" value={form.email} onChange={setF('email')}
            error={errors.email} placeholder="name@clinic.uz"
            autoComplete="email"
          />
          <div className="form-row">
            <Field
              label="Отдел / Должность" value={form.department} onChange={setF('department')}
              placeholder="Кардиология"
            />
            <Field
              label="Телефон" value={form.phone} onChange={setF('phone')}
              placeholder="+998 90 ..."
            />
          </div>
          <div className="form-row">
            <Field
              label="Пароль *" type="password" value={form.password} onChange={setF('password')}
              error={errors.password} placeholder="Минимум 6 символов"
              autoComplete="new-password"
            />
            <Field
              label="Повторите пароль *" type="password" value={form.password2} onChange={setF('password2')}
              error={errors.password2} placeholder="••••••"
              autoComplete="new-password"
            />
          </div>
          <button
            className="btn btn-primary btn-full btn-lg"
            type="submit"
            disabled={loading}
            style={{ marginTop: 4 }}
          >
            {loading
              ? <><span className="spinner-sm" /> Создаём аккаунт...</>
              : 'Зарегистрироваться'}
          </button>
        </form>

        <div className="auth-footer">
          Уже есть аккаунт? <Link to="/login">Войти</Link>
        </div>
        <div className="auth-footer" style={{ marginTop: 6 }}>
          <Link to="/" style={{ color: 'var(--text-muted)' }}>← На главную</Link>
        </div>
      </div>
    </div>
  );
}