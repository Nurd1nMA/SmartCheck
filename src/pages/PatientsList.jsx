import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useFetch, useDebounce } from '../hooks';
import { getPatients } from '../api';
import { initials, STATUS_LABELS } from '../utils';

export default function PatientsList() {
  const [searchParams] = useSearchParams();
  const [search,  setSearch]  = useState('');
  const [status,  setStatus]  = useState(searchParams.get('status') || '');
  const [sortBy,  setSortBy]  = useState('name');
  const [sortDir, setSortDir] = useState('asc');
  const [view,    setView]    = useState('grid'); // 'grid' | 'table'

  const { canEdit } = useAuth();
  const { data: patients, loading, error } = useFetch(getPatients);
  const debounced = useDebounce(search, 250);

  const filtered = useMemo(() => {
    if (!patients) return [];
    let list = [...patients];

    if (debounced) {
      const q = debounced.toLowerCase();
      list = list.filter(p =>
        [p.name, p.room, p.diagnosis, p.doctor].some(s => s?.toLowerCase().includes(q))
      );
    }
    if (status) list = list.filter(p => p.status === status);

    list.sort((a, b) => {
      let av = sortBy === 'age' ? Number(a.age) : a[sortBy] || '';
      let bv = sortBy === 'age' ? Number(b.age) : b[sortBy] || '';
      if (typeof av === 'string') av = av.toLowerCase();
      if (typeof bv === 'string') bv = bv.toLowerCase();
      if (av < bv) return sortDir === 'asc' ? -1 : 1;
      if (av > bv) return sortDir === 'asc' ?  1 : -1;
      return 0;
    });

    return list;
  }, [patients, debounced, status, sortBy, sortDir]);

  const toggleSort = (col) => {
    if (sortBy === col) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortBy(col); setSortDir('asc'); }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Загрузка пациентов...</span></div>;
  if (error)   return <div className="alert alert-error">{error}</div>;

  return (
    <div className="fade-up">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Пациенты</h1>
          <p>{patients?.length} записей в базе</p>
        </div>
        {canEdit && <Link to="/patients/new" className="btn btn-primary">+ Добавить</Link>}
      </div>

      {/* Filters */}
      <div className="filters-bar">
        <div className="search-wrap">
          <span className="search-icon">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>
            </svg>
          </span>
          <input placeholder="Поиск по имени, палате, диагнозу..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>

        <select className="filter-select" value={status} onChange={e => setStatus(e.target.value)}>
          <option value="">Все статусы</option>
          <option value="active">Активные</option>
          <option value="critical">Критические</option>
          <option value="discharged">Выписанные</option>
        </select>

        <select className="filter-select" value={sortBy} onChange={e => setSortBy(e.target.value)}>
          <option value="name">Сортировка: имя</option>
          <option value="age">Сортировка: возраст</option>
          <option value="room">Сортировка: палата</option>
          <option value="admittedDate">Сортировка: дата</option>
        </select>

        <button className="btn btn-ghost btn-sm" onClick={() => setSortDir(d => d === 'asc' ? 'desc' : 'asc')}>
          {sortDir === 'asc' ? '↑ По возрастанию' : '↓ По убыванию'}
        </button>

        <div style={{ display: 'flex', gap: 4 }}>
          <button className={`btn btn-sm ${view==='grid'?'btn-secondary':'btn-ghost'}`} onClick={() => setView('grid')}>
            ⊞ Карточки
          </button>
          <button className={`btn btn-sm ${view==='table'?'btn-secondary':'btn-ghost'}`} onClick={() => setView('table')}>
            ☰ Таблица
          </button>
        </div>
      </div>

      {/* Results count */}
      <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 16 }}>
        Найдено: <b style={{ color: 'var(--text-primary)' }}>{filtered.length}</b> пациентов
        {(search || status) && (
          <button className="btn btn-ghost btn-sm" style={{ marginLeft: 8 }}
            onClick={() => { setSearch(''); setStatus(''); }}>
            ✕ Сбросить
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🔍</div>
          <div className="empty-title">Пациенты не найдены</div>
          <div className="empty-text">Попробуйте изменить параметры поиска</div>
          {canEdit && <Link to="/patients/new" className="btn btn-primary">+ Добавить пациента</Link>}
        </div>
      ) : view === 'grid' ? (
        <GridView patients={filtered} />
      ) : (
        <TableView patients={filtered} onSort={toggleSort} sortBy={sortBy} sortDir={sortDir} canEdit={canEdit} />
      )}
    </div>
  );
}

/* ── Grid view ─────────────────────────────────────── */
function GridView({ patients }) {
  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill,minmax(290px,1fr))', gap: 16 }}>
      {patients.map(p => {
        const done  = p.medications?.every(m => m.issued);
        const count = p.medications?.filter(m => m.issued).length || 0;
        const total = p.medications?.length || 0;
        const pct   = total ? Math.round(count/total*100) : 0;
        const st    = STATUS_LABELS[p.status];

        return (
          <Link key={p.id} to={`/patients/${p.id}`}
            className={`patient-card${done?' patient-card--done':''}${p.status==='critical'?' patient-card--critical':''}`}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div className={`p-avatar${done?' p-avatar--done':p.status==='critical'?' p-avatar--critical':''}`}>
                {initials(p.name)}
              </div>
              {st && <span className={`badge ${st.cls}`}>{st.label}</span>}
            </div>
            <div>
              <div style={{ fontWeight: 700, fontSize: 15 }}>{p.name}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4, display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                <span>🏥 {p.room}</span>
                {p.age > 0 && <span>{p.age} лет</span>}
                {p.bloodType && <span>🩸 {p.bloodType}</span>}
              </div>
              <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 4 }}>{p.diagnosis}</div>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 'auto' }}>
              <div className="progress-bar" style={{ flex: 1 }}>
                <div className="progress-fill" style={{
                  width: `${pct}%`,
                  background: done ? 'var(--green-500)' : 'var(--blue-500)',
                }} />
              </div>
              <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', whiteSpace: 'nowrap' }}>
                {count}/{total}
              </span>
            </div>
          </Link>
        );
      })}
    </div>
  );
}

/* ── Table view ────────────────────────────────────── */
function TableView({ patients, onSort, sortBy, sortDir, canEdit }) {
  const Th = ({ col, children }) => (
    <th onClick={() => onSort(col)} style={{ cursor: 'pointer', userSelect: 'none' }}>
      {children} {sortBy === col && (sortDir === 'asc' ? '↑' : '↓')}
    </th>
  );
  return (
    <div className="card">
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              <Th col="name">ФИО</Th>
              <Th col="age">Возраст</Th>
              <Th col="room">Палата</Th>
              <th>Диагноз</th>
              <th>Статус</th>
              <th>Препараты</th>
              <th>Действия</th>
            </tr>
          </thead>
          <tbody>
            {patients.map(p => {
              const count = p.medications?.filter(m => m.issued).length || 0;
              const total = p.medications?.length || 0;
              const st = STATUS_LABELS[p.status];
              return (
                <tr key={p.id}>
                  <td>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div className="user-avatar-sm">{initials(p.name)}</div>
                      <span style={{ fontWeight: 600 }}>{p.name}</span>
                    </div>
                  </td>
                  <td>{p.age || '—'}</td>
                  <td>{p.room}</td>
                  <td style={{ maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.diagnosis}</td>
                  <td>{st && <span className={`badge ${st.cls}`}>{st.label}</span>}</td>
                  <td>
                    <span style={{ fontSize: 13, fontWeight: 600 }}>{count}/{total}</span>
                  </td>
                  <td>
                    <div className="td-actions">
                      <Link to={`/patients/${p.id}`} className="btn btn-sm btn-secondary">Просмотр</Link>
                      {canEdit && <Link to={`/patients/${p.id}/edit`} className="btn btn-sm btn-ghost">Изменить</Link>}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}