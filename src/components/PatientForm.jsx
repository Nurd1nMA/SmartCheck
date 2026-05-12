import { useState } from 'react';
import { BLOOD_TYPES, uid, today } from '../utils';

const EMPTY_FORM = {
  name: '', age: '', room: '', bloodType: '', diagnosis: '',
  phone: '', allergies: '', doctor: '', admittedDate: today(),
  status: 'active', medications: [],
};

export default function PatientForm({ initial = {}, onSubmit, loading, rooms = [] }) {
  const [form, setForm]   = useState({ ...EMPTY_FORM, ...initial });
  const [meds, setMeds]   = useState(initial.medications || [{ id: uid(), name: '', dosage: '', time: '' }]);
  const [errors, setErrors] = useState({});

  const setF = (k, v) => { setForm(f => ({ ...f, [k]: v })); setErrors(e => ({ ...e, [k]: '' })); };

  const addMed    = () => setMeds(m => [...m, { id: uid(), name: '', dosage: '', time: '' }]);
  const removeMed = (id) => setMeds(m => m.filter(x => x.id !== id));
  const setMedF   = (id, k, v) => setMeds(m => m.map(x => x.id === id ? { ...x, [k]: v } : x));

  const validate = () => {
    const e = {};
    if (!form.name.trim())      e.name      = 'Обязательное поле';
    if (!form.room.trim())      e.room      = 'Обязательное поле';
    if (!form.diagnosis.trim()) e.diagnosis = 'Обязательное поле';
    if (form.age && (isNaN(form.age) || form.age < 0 || form.age > 120)) e.age = 'Некорректный возраст';
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    const validMeds = meds.filter(m => m.name.trim()).map(m => ({ ...m, issued: m.issued || false }));
    onSubmit({ ...form, age: parseInt(form.age) || 0, medications: validMeds });
  };

  return (
    <form onSubmit={handleSubmit} noValidate>
      <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

        <p className="form-section-label">Личные данные</p>

        <div className="form-group">
          <label className="form-label">ФИО *</label>
          <input className={`form-input${errors.name?' err':''}`}
            placeholder="Иванов Иван Иванович"
            value={form.name} onChange={e => setF('name', e.target.value)} />
          {errors.name && <div className="field-error">{errors.name}</div>}
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Возраст</label>
            <input className={`form-input${errors.age?' err':''}`}
              type="number" min="0" max="120" placeholder="45"
              value={form.age} onChange={e => setF('age', e.target.value)} />
            {errors.age && <div className="field-error">{errors.age}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Группа крови</label>
            <select className="form-select" value={form.bloodType} onChange={e => setF('bloodType', e.target.value)}>
              <option value="">— не указана —</option>
              {BLOOD_TYPES.map(b => <option key={b}>{b}</option>)}
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Палата *</label>
            <input
              className={`form-input${errors.room?' err':''}`}
              placeholder="Палата 201"
              list="rooms-datalist"
              value={form.room}
              onChange={e => setF('room', e.target.value)}
            />
            {rooms.length > 0 && (
              <datalist id="rooms-datalist">
                {rooms.map(r => <option key={r.id} value={r.name} />)}
              </datalist>
            )}
            {errors.room && <div className="field-error">{errors.room}</div>}
          </div>
          <div className="form-group">
            <label className="form-label">Статус</label>
            <select className="form-select" value={form.status} onChange={e => setF('status', e.target.value)}>
              <option value="active">Активный</option>
              <option value="critical">Критический</option>
              <option value="discharged">Выписан</option>
            </select>
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Телефон</label>
            <input className="form-input" placeholder="+998 90 000-00-00"
              value={form.phone} onChange={e => setF('phone', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Дата поступления</label>
            <input className="form-input" placeholder={today()}
              value={form.admittedDate} onChange={e => setF('admittedDate', e.target.value)} />
          </div>
        </div>

        <div className="form-row">
          <div className="form-group">
            <label className="form-label">Лечащий врач</label>
            <input className="form-input" placeholder="Иванова С.В."
              value={form.doctor} onChange={e => setF('doctor', e.target.value)} />
          </div>
          <div className="form-group">
            <label className="form-label">Аллергии</label>
            <input className="form-input" placeholder="Нет / Пенициллин..."
              value={form.allergies} onChange={e => setF('allergies', e.target.value)} />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Диагноз *</label>
          <input className={`form-input${errors.diagnosis?' err':''}`}
            placeholder="Гипертоническая болезнь II ст."
            value={form.diagnosis} onChange={e => setF('diagnosis', e.target.value)} />
          {errors.diagnosis && <div className="field-error">{errors.diagnosis}</div>}
        </div>

        <p className="form-section-label" style={{marginTop:8}}>Назначенные препараты</p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 10 }}>
          {meds.map(med => (
            <div key={med.id} style={{
              display: 'flex', gap: 8, alignItems: 'center',
              background: 'var(--surface-2)', border: '1.5px solid var(--border)',
              borderRadius: 'var(--radius-sm)', padding: '10px',
            }}>
              <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '2fr 1fr 1fr', gap: 8 }}>
                <input className="form-input" placeholder="Название препарата"
                  value={med.name} onChange={e => setMedF(med.id, 'name', e.target.value)} />
                <input className="form-input" placeholder="Дозировка"
                  value={med.dosage} onChange={e => setMedF(med.id, 'dosage', e.target.value)} />
                <input className="form-input" placeholder="Время (08:00)"
                  value={med.time} onChange={e => setMedF(med.id, 'time', e.target.value)} />
              </div>
              {meds.length > 1 && (
                <button type="button" onClick={() => removeMed(med.id)}
                  style={{
                    background:'var(--red-50)', border:'none', borderRadius:8,
                    width:32, height:32, cursor:'pointer', color:'var(--red-500)',
                    display:'flex', alignItems:'center', justifyContent:'center', fontSize:18, flexShrink:0,
                  }}>×</button>
              )}
            </div>
          ))}
        </div>

        <button type="button" onClick={addMed}
          style={{
            display:'flex', alignItems:'center', gap:7, justifyContent:'center',
            background:'var(--blue-50)', color:'var(--blue-600)',
            border:'1.5px dashed var(--blue-200)', borderRadius:'var(--radius-sm)',
            padding:'9px 14px', fontFamily:'inherit', fontSize:13, fontWeight:700,
            cursor:'pointer', marginBottom:24, transition:'background .2s',
          }}>
          + Добавить препарат
        </button>

        <button type="submit" className="btn btn-primary btn-full btn-lg" disabled={loading}>
          {loading ? <><span className="spinner-sm" /> Сохранение...</> : '💾 Сохранить'}
        </button>
      </div>
    </form>
  );
}

// small section label
function FormSectionLabel({ children }) {
  return (
    <p style={{
      fontSize: 11, fontWeight: 800, textTransform: 'uppercase',
      letterSpacing: '.7px', color: 'var(--text-muted)',
      marginBottom: 12, paddingBottom: 8,
      borderBottom: '1.5px solid var(--border)',
    }}>{children}</p>
  );
}

// expose for use inside form
PatientForm.SectionLabel = FormSectionLabel;