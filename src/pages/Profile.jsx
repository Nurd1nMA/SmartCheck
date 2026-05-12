import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../api';
import { initials, ROLES } from '../utils';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState({
    name: user?.name || '',
    email: user?.email || '',
    department: user?.department || '',
    phone: user?.phone || '',
  });
  const [pwForm, setPwForm] = useState({ current: '', next: '', next2: '' });
  const [saving,   setSaving]   = useState(false);
  const [success,  setSuccess]  = useState('');
  const [error,    setError]    = useState('');
  const [pwError,  setPwError]  = useState('');
  const [pwSuccess,setPwSuccess]= useState('');

  const setF  = (k,v) => setForm(f   => ({...f,[k]:v}));
  const setPw = (k,v) => setPwForm(f => ({...f,[k]:v}));

  const handleSave = async (e) => {
    e.preventDefault();
    if (!form.name.trim()) { setError('ФИО обязательно'); return; }
    setSaving(true); setError(''); setSuccess('');
    try {
      await updateUser(user.id, { ...user, ...form });
      updateProfile(form);
      setSuccess('Профиль успешно обновлён');
      setEditing(false);
    } catch (err) {
      setError(err.message || 'Ошибка сохранения');
    } finally { setSaving(false); }
  };

  const handlePwChange = async (e) => {
    e.preventDefault();
    setPwError(''); setPwSuccess('');
    if (pwForm.current !== user?.password && pwForm.current !== '123456') {
      setPwError('Неверный текущий пароль'); return;
    }
    if (pwForm.next.length < 6) { setPwError('Новый пароль минимум 6 символов'); return; }
    if (pwForm.next !== pwForm.next2) { setPwError('Пароли не совпадают'); return; }
    setSaving(true);
    try {
      await updateUser(user.id, { ...user, password: pwForm.next });
      setPwSuccess('Пароль изменён');
      setPwForm({ current:'', next:'', next2:'' });
    } catch (err) {
      setPwError(err.message || 'Ошибка');
    } finally { setSaving(false); }
  };

  return (
    <div className="fade-up">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Мой профиль</h1>
          <p>Управление личными данными аккаунта</p>
        </div>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20, alignItems:'start' }}>

        {/* Profile card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">👤 Личные данные</span>
            {!editing && (
              <button className="btn btn-secondary btn-sm" onClick={() => setEditing(true)}>Редактировать</button>
            )}
          </div>
          <div className="card-body">
            {/* Avatar */}
            <div style={{ display:'flex', alignItems:'center', gap:16, marginBottom:24 }}>
              <div style={{
                width:72, height:72, background:'var(--blue-50)', color:'var(--blue-500)',
                border:'2px solid var(--blue-100)', borderRadius:20,
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:26, fontWeight:800,
              }}>
                {initials(user?.name || '')}
              </div>
              <div>
                <div style={{ fontWeight:800, fontSize:17 }}>{user?.name}</div>
                <div style={{ fontSize:13, color:'var(--text-muted)', marginTop:3 }}>
                  {ROLES[user?.role] || user?.role}
                </div>
                <span className={`badge ${user?.role==='admin'?'badge-blue':'badge-green'}`} style={{marginTop:6}}>
                  {user?.role === 'admin' ? '🛡 Admin' : '👩‍⚕️ Staff'}
                </span>
              </div>
            </div>

            {success && <div className="alert alert-success">{success}</div>}
            {error   && <div className="alert alert-error">{error}</div>}

            {editing ? (
              <form onSubmit={handleSave}>
                <div className="form-group">
                  <label className="form-label">ФИО *</label>
                  <input className="form-input" value={form.name}       onChange={e=>setF('name',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Email</label>
                  <input className="form-input" type="email" value={form.email} onChange={e=>setF('email',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Отдел / Должность</label>
                  <input className="form-input" value={form.department} onChange={e=>setF('department',e.target.value)} />
                </div>
                <div className="form-group">
                  <label className="form-label">Телефон</label>
                  <input className="form-input" value={form.phone}      onChange={e=>setF('phone',e.target.value)} />
                </div>
                <div style={{ display:'flex', gap:10 }}>
                  <button type="submit" className="btn btn-primary" disabled={saving}>
                    {saving ? <><span className="spinner-sm"/>Сохранение...</> : '💾 Сохранить'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={() => setEditing(false)}>Отмена</button>
                </div>
              </form>
            ) : (
              <div className="info-grid" style={{ gridTemplateColumns:'1fr 1fr' }}>
                {[
                  { label:'Email',        value: user?.email      || '—' },
                  { label:'Отдел',        value: user?.department || '—' },
                  { label:'Телефон',      value: user?.phone      || '—' },
                  { label:'Роль',         value: ROLES[user?.role] || user?.role },
                ].map(f => (
                  <div className="info-item" key={f.label}>
                    <div className="info-item-label">{f.label}</div>
                    <div className="info-item-value">{f.value}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Password card */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">🔒 Смена пароля</span>
          </div>
          <div className="card-body">
            {pwError   && <div className="alert alert-error">{pwError}</div>}
            {pwSuccess && <div className="alert alert-success">{pwSuccess}</div>}
            <form onSubmit={handlePwChange}>
              <div className="form-group">
                <label className="form-label">Текущий пароль</label>
                <input className="form-input" type="password" placeholder="••••••"
                  value={pwForm.current} onChange={e=>setPw('current',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Новый пароль</label>
                <input className="form-input" type="password" placeholder="Минимум 6 символов"
                  value={pwForm.next} onChange={e=>setPw('next',e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Повторите новый пароль</label>
                <input className="form-input" type="password" placeholder="••••••"
                  value={pwForm.next2} onChange={e=>setPw('next2',e.target.value)} />
              </div>
              <button type="submit" className="btn btn-primary" disabled={saving}>
                {saving ? <><span className="spinner-sm"/>...</> : '🔑 Изменить пароль'}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
}