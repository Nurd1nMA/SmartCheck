import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch } from '../hooks';
import { getPatients } from '../api';
import { STATUS_LABELS, initials } from '../utils';

export default function Dashboard() {
  const { user, canEdit } = useAuth();
  const { data: patients, loading, error } = useFetch(getPatients);

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Загрузка дашборда...</span></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  const total      = patients?.length || 0;
  const active     = patients?.filter(p => p.status === 'active').length    || 0;
  const critical   = patients?.filter(p => p.status === 'critical').length  || 0;
  const discharged = patients?.filter(p => p.status === 'discharged').length|| 0;
  const allMedsDone = patients?.filter(p => p.medications?.every(m => m.issued)).length || 0;
  const pendingMeds = total - allMedsDone;

  const criticalPatients = patients?.filter(p => p.status === 'critical') || [];
  const recentPatients   = [...(patients || [])].slice(-4).reverse();

  return (
    <div className="fade-up">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Дашборд</h1>
          <p>Добро пожаловать, {user?.name?.split(' ')[0]}! Вот сводка за сегодня.</p>
        </div>
        {canEdit && <Link to="/patients/new" className="btn btn-primary">+ Добавить пациента</Link>}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(200px,1fr))', gap: 16, marginBottom: 28 }}>
        <StatCard value={total}      label="Всего пациентов"     icon="🏥" color="blue"  />
        <StatCard value={active}     label="Активных"             icon="✅" color="green" />
        <StatCard value={critical}   label="Критических"          icon="🚨" color="red"   />
        <StatCard value={discharged} label="Выписано"             icon="🚪" color="muted" />
        <StatCard value={allMedsDone}label="Препараты выданы"     icon="💊" color="green" />
        <StatCard value={pendingMeds}label="Ожидают выдачи"       icon="⏳" color="amber" />
      </div>

      <div className="dash-grid-2col">
        {/* Critical patients */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🚨 Критические пациенты</span>
            <Link to="/patients?status=critical" className="btn btn-sm btn-secondary">Все</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {criticalPatients.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 20px' }}>
                <div className="empty-icon" style={{ fontSize: 32 }}>✅</div>
                <div className="empty-title" style={{ fontSize: 14 }}>Критических нет</div>
              </div>
            ) : (
              criticalPatients.map(p => <PatientRow key={p.id} p={p} />)
            )}
          </div>
        </div>

        {/* Recent */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🕐 Последние поступления</span>
            <Link to="/patients" className="btn btn-sm btn-secondary">Все</Link>
          </div>
          <div className="card-body" style={{ padding: 0 }}>
            {recentPatients.map(p => <PatientRow key={p.id} p={p} />)}
          </div>
        </div>
      </div>

      {/* Medications summary */}
      <div className="card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <span className="card-title">💊 Статус препаратов сегодня</span>
        </div>
        <div className="card-body">
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 8 }}>
            <div className="progress-bar" style={{ flex: 1 }}>
              <div className="progress-fill" style={{ width: `${total ? Math.round(allMedsDone/total*100) : 0}%`, background: 'var(--green-500)' }} />
            </div>
            <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
              {allMedsDone}/{total} пациентов
            </span>
          </div>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>
            {allMedsDone === total
              ? '✅ Все препараты выданы!'
              : `⏳ У ${pendingMeds} пациентов есть невыданные препараты`}
          </p>
        </div>
      </div>
    </div>
  );
}

function StatCard({ value, label, icon, color }) {
  const colors = {
    blue:  { bg: 'var(--blue-50)',  c: 'var(--blue-600)',  val: 'var(--blue-500)' },
    green: { bg: 'var(--green-50)', c: 'var(--green-600)', val: 'var(--green-500)' },
    red:   { bg: 'var(--red-50)',   c: 'var(--red-600)',   val: 'var(--red-500)' },
    amber: { bg: 'var(--amber-50)', c: 'var(--amber-500)', val: 'var(--amber-500)' },
    muted: { bg: 'var(--surface-2)',c: 'var(--text-muted)', val: 'var(--text-secondary)' },
  };
  const col = colors[color] || colors.blue;
  return (
    <div className="stat-card" style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
      <div className="stat-card-icon" style={{ background: col.bg, color: col.c }}>{icon}</div>
      <div>
        <div className="stat-card-value" style={{ color: col.val }}>{value}</div>
        <div className="stat-card-label">{label}</div>
      </div>
    </div>
  );
}

function PatientRow({ p }) {
  const st = STATUS_LABELS[p.status];
  return (
    <Link to={`/patients/${p.id}`} style={{ textDecoration: 'none', color: 'inherit' }}>
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '12px 20px',
        borderBottom: '1px solid var(--border)', transition: 'background .15s',
      }}
        onMouseEnter={e => e.currentTarget.style.background = 'var(--surface-2)'}
        onMouseLeave={e => e.currentTarget.style.background = ''}
      >
        <div className="user-avatar-sm" style={{ flexShrink: 0 }}>{initials(p.name)}</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: 14, fontWeight: 700, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.name}</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{p.room} · {p.diagnosis}</div>
        </div>
        {st && <span className={`badge ${st.cls}`}>{st.label}</span>}
      </div>
    </Link>
  );
}