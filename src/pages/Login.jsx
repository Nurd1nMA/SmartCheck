import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { loginUser } from '../api';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate  = useNavigate();

  const [email,    setEmail]    = useState('');
  const [password, setPassword] = useState('');
  const [error,    setError]    = useState('');
  const [loading,  setLoading]  = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    if (!email || !password) { setError('Заполните все поля'); return; }
    setLoading(true);
    try {
      const user = await loginUser(email.trim().toLowerCase(), password);
      login(user);
      navigate('/dashboard');
    } catch (err) {
      setError(err.message || 'Ошибка входа');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">＋</div>
          <span className="auth-logo-text">SmartCheck</span>
        </div>
        <h1 className="auth-title">Вход в систему</h1>
        <p className="auth-subtitle">Добро пожаловать! Введите свои данные.</p>

        {error && <div className="alert alert-error">{error}</div>}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input className="form-input" type="email" placeholder="doctor@clinic.uz"
              value={email} onChange={e => setEmail(e.target.value)}
              autoComplete="email" />
          </div>
          <div className="form-group">
            <label className="form-label">Пароль</label>
            <input className="form-input" type="password" placeholder="••••••"
              value={password} onChange={e => setPassword(e.target.value)}
              autoComplete="current-password" />
          </div>
          <button className="btn btn-primary btn-full btn-lg" type="submit" disabled={loading}>
            {loading ? <><span className="spinner-sm" /> Входим...</> : 'Войти'}
          </button>
        </form>

        <div className="auth-footer">
          Нет аккаунта? <Link to="/register">Зарегистрироваться</Link>
        </div>
        <div className="auth-footer" style={{marginTop:6}}>
          <Link to="/" style={{color:'var(--text-muted)'}}>← На главную</Link>
        </div>
        <div className="alert alert-info" style={{marginTop:20,marginBottom:0,fontSize:12}}>
          <b>Демо:</b> doctor@clinic.uz / 123456
        </div>
      </div>
    </div>
  );
}