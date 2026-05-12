import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function Home() {
  const { user } = useAuth();

  return (
    <div className="home-hero">
      <nav className="home-nav">
        <Link to="/" className="home-nav-logo">
          <div className="sidebar-logo-icon">＋</div>
          <span className="sidebar-logo-text">SmartCheck</span>
        </Link>
        <div style={{ display: 'flex', gap: 10 }}>
          {user ? (
            <Link to="/dashboard" className="btn btn-primary">Перейти в систему →</Link>
          ) : (
            <>
              <Link to="/login"    className="btn btn-ghost">Войти</Link>
              <Link to="/register" className="btn btn-primary">Регистрация</Link>
            </>
          )}
        </div>
      </nav>

      <div className="home-hero-body">
        <div className="home-hero-tag">🏥 Медицинская информационная система</div>
        <h1 className="home-hero-title">
          Умное управление<br /><span>пациентами</span> и препаратами
        </h1>
        <p className="home-hero-sub">
          SmartCheck — цифровая платформа для больниц. Отслеживайте пациентов,
          управляйте назначениями и контролируйте выдачу лекарств в режиме реального времени.
        </p>
        <div className="home-hero-btns">
          {user ? (
            <Link to="/dashboard" className="btn btn-primary btn-lg">Открыть дашборд →</Link>
          ) : (
            <>
              <Link to="/register" className="btn btn-primary btn-lg">Начать бесплатно</Link>
              <Link to="/login"    className="btn btn-secondary btn-lg">Войти в систему</Link>
            </>
          )}
        </div>
      </div>

      <div className="home-features">
        <div className="feature-card">
          <div className="feature-icon">📋</div>
          <div className="feature-title">Карты пациентов</div>
          <div className="feature-text">Полная информация о каждом пациенте: диагноз, анамнез, аллергии и история лечения.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">💊</div>
          <div className="feature-title">Контроль препаратов</div>
          <div className="feature-text">Отслеживайте выдачу лекарств в реальном времени. Никаких пропусков и ошибок дозировки.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📊</div>
          <div className="feature-title">Аналитика и отчёты</div>
          <div className="feature-text">Дашборд с ключевыми показателями отделения: загруженность, критические пациенты, статистика.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">🔒</div>
          <div className="feature-title">Ролевой доступ</div>
          <div className="feature-text">Разграничение прав для врачей, медсестёр и администраторов. Безопасность данных пациентов.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">📱</div>
          <div className="feature-title">Мобильная версия</div>
          <div className="feature-text">Работайте с планшета или смартфона у постели пациента. Адаптивный интерфейс для любых устройств.</div>
        </div>
        <div className="feature-card">
          <div className="feature-icon">⚡</div>
          <div className="feature-title">QR-сканирование</div>
          <div className="feature-text">Мгновенный доступ к карте пациента по QR-коду на браслете. Быстро и без ошибок.</div>
        </div>
      </div>
    </div>
  );
}