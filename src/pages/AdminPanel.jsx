import { useState } from 'react';
import { useFetch } from '../hooks';
import { getUsers, getPatients, deleteUser, updateUser } from '../api';
import { initials, ROLES, STATUS_LABELS } from '../utils';
import { useAuth } from '../context/AuthContext';

export default function AdminPanel() {
  const { canManageUsers } = useAuth();
  const { data: users,    loading: ul, error: ue, reload: reloadUsers }    = useFetch(getUsers);
  const { data: patients, loading: pl, error: pe }                          = useFetch(getPatients);
  const [tab, setTab]         = useState('users');    // 'users' | 'patients' | 'stats'
  const [deleting, setDeleting] = useState(null);
  const [editRole, setEditRole] = useState(null);     // { userId, role }
  const [saving,   setSaving]   = useState(false);

  const handleDeleteUser = async (id) => {
    if (!window.confirm('Удалить пользователя?')) return;
    setDeleting(id);
    try { await deleteUser(id); await reloadUsers(); }
    finally { setDeleting(null); }
  };

  const handleSaveRole = async () => {
    if (!editRole) return;
    setSaving(true);
    try {
      const user = users.find(u => u.id === editRole.userId);
      await updateUser(editRole.userId, { ...user, role: editRole.role });
      await reloadUsers();
      setEditRole(null);
    } finally { setSaving(false); }
  };

  const loading = ul || pl;
  const error   = ue || pe;

  if (loading) return <div className="loading-center"><div className="spinner"/><span>Загрузка...</span></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  const totalMeds    = patients?.reduce((acc,p) => acc + (p.medications?.length||0), 0) || 0;
  const issuedMeds   = patients?.reduce((acc,p) => acc + (p.medications?.filter(m=>m.issued).length||0), 0) || 0;
  const criticalCount= patients?.filter(p=>p.status==='critical').length || 0;

  return (
    <div className="fade-up">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>🛡 Admin Panel</h1>
          <p>Управление пользователями, пациентами и системой</p>
        </div>
      </div>

      {/* Tabs */}
      <div style={{ display:'flex', gap:4, marginBottom:24, background:'var(--surface)', border:'1.5px solid var(--border)', borderRadius:'var(--radius-sm)', padding:4, width:'fit-content' }}>
        {[
          { key:'users',    label:'👥 Пользователи' },
          { key:'patients', label:'🏥 Пациенты' },
          { key:'stats',    label:'📊 Статистика' },
        ].map(t => (
          <button key={t.key}
            className={`btn btn-sm ${tab===t.key?'btn-primary':'btn-ghost'}`}
            onClick={() => setTab(t.key)}
          >{t.label}</button>
        ))}
      </div>

      {/* ── USERS ── */}
      {tab === 'users' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Пользователи системы</span>
            <span className="badge badge-blue">{users?.length} аккаунтов</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Пользователь</th>
                  <th>Email</th>
                  <th>Отдел</th>
                  <th>Роль</th>
                  <th>Действия</th>
                </tr>
              </thead>
              <tbody>
                {users?.map(u => (
                  <tr key={u.id}>
                    <td>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div className="user-avatar-sm">{initials(u.name)}</div>
                        <span style={{ fontWeight:600 }}>{u.name}</span>
                      </div>
                    </td>
                    <td style={{ color:'var(--text-secondary)' }}>{u.email}</td>
                    <td style={{ color:'var(--text-muted)' }}>{u.department || '—'}</td>
                    <td>
                      {canManageUsers && editRole?.userId === u.id ? (
                        <div style={{ display:'flex', gap:6, alignItems:'center' }}>
                          <select
                            className="filter-select" style={{ padding:'6px 10px', fontSize:13 }}
                            value={editRole.role}
                            onChange={e => setEditRole(r => ({...r, role: e.target.value}))}
                          >
                            <option value="admin">Admin</option>
                            <option value="doctor">Врач</option>
                            <option value="nurse">Медсестра</option>
                          </select>
                          <button className="btn btn-success btn-sm" onClick={handleSaveRole} disabled={saving}>✓</button>
                          <button className="btn btn-ghost btn-sm" onClick={() => setEditRole(null)}>✕</button>
                        </div>
                      ) : (
                        <span className={`badge ${u.role==='admin'?'badge-blue':'badge-green'}`}>
                          {ROLES[u.role] || u.role}
                        </span>
                      )}
                    </td>
                    <td>
                      {canManageUsers ? (
                        <div className="td-actions">
                          <button className="btn btn-sm btn-secondary"
                            onClick={() => setEditRole({ userId: u.id, role: u.role })}>
                            Роль
                          </button>
                          <button className="btn btn-sm btn-danger"
                            onClick={() => handleDeleteUser(u.id)}
                            disabled={deleting === u.id}>
                            {deleting === u.id ? '...' : 'Удалить'}
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize:12, color:'var(--text-muted)' }}>только просмотр</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── PATIENTS ── */}
      {tab === 'patients' && (
        <div className="card">
          <div className="card-header">
            <span className="card-title">Все пациенты</span>
            <span className="badge badge-blue">{patients?.length} записей</span>
          </div>
          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>Пациент</th><th>Палата</th><th>Диагноз</th>
                  <th>Статус</th><th>Врач</th><th>Поступление</th>
                </tr>
              </thead>
              <tbody>
                {patients?.map(p => {
                  const st = STATUS_LABELS[p.status];
                  return (
                    <tr key={p.id}>
                      <td>
                        <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                          <div className="user-avatar-sm">{initials(p.name)}</div>
                          <span style={{ fontWeight:600 }}>{p.name}</span>
                        </div>
                      </td>
                      <td>{p.room}</td>
                      <td style={{ maxWidth:180, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap', color:'var(--text-secondary)' }}>{p.diagnosis}</td>
                      <td>{st && <span className={`badge ${st.cls}`}>{st.label}</span>}</td>
                      <td style={{ color:'var(--text-muted)' }}>{p.doctor || '—'}</td>
                      <td style={{ color:'var(--text-muted)' }}>{p.admittedDate || '—'}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ── STATS ── */}
      {tab === 'stats' && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(200px,1fr))', gap:16 }}>
            {[
              { label:'Всего пациентов',  value: patients?.length || 0,       icon:'🏥', color:'#2b7fd4' },
              { label:'Критических',      value: criticalCount,                icon:'🚨', color:'#ef4444' },
              { label:'Пользователей',    value: users?.length || 0,           icon:'👥', color:'#16a34a' },
              { label:'Всего препаратов', value: totalMeds,                    icon:'💊', color:'#d97706' },
              { label:'Выдано препаратов',value: issuedMeds,                   icon:'✅', color:'#16a34a' },
              { label:'Не выдано',        value: totalMeds - issuedMeds,       icon:'⏳', color:'#d97706' },
            ].map(s => (
              <div key={s.label} className="stat-card" style={{ display:'flex', alignItems:'center', gap:14 }}>
                <div style={{ fontSize:28 }}>{s.icon}</div>
                <div>
                  <div style={{ fontSize:28, fontWeight:800, color:s.color }}>{s.value}</div>
                  <div style={{ fontSize:12, color:'var(--text-muted)', fontWeight:600 }}>{s.label}</div>
                </div>
              </div>
            ))}
          </div>

          <div className="card">
            <div className="card-header"><span className="card-title">Распределение препаратов</span></div>
            <div className="card-body">
              <div style={{ display:'flex', alignItems:'center', gap:14, marginBottom:8 }}>
                <div className="progress-bar" style={{ flex:1, height:12 }}>
                  <div className="progress-fill" style={{
                    width: `${totalMeds ? Math.round(issuedMeds/totalMeds*100) : 0}%`,
                    background:'var(--green-500)',
                  }}/>
                </div>
                <span style={{ fontSize:14, fontWeight:700 }}>
                  {totalMeds ? Math.round(issuedMeds/totalMeds*100) : 0}%
                </span>
              </div>
              <p style={{ fontSize:13, color:'var(--text-muted)' }}>
                Выдано {issuedMeds} из {totalMeds} назначений
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}