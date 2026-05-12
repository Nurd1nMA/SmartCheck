import { Link, useNavigate } from 'react-router-dom';

export default function NotFound() {
  const navigate = useNavigate();
  return (
    <div className="not-found-wrap">
      <div className="not-found-code">404</div>
      <h1 className="not-found-title">Страница не найдена</h1>
      <p className="not-found-text">
        Запрошенная страница не существует или была перемещена.
      </p>
      <div style={{ display:'flex', gap:12, marginTop:8 }}>
        <button className="btn btn-ghost" onClick={() => navigate(-1)}>← Назад</button>
        <Link to="/" className="btn btn-primary">На главную</Link>
        <Link to="/dashboard" className="btn btn-secondary">Dashboard</Link>
      </div>
    </div>
  );
}