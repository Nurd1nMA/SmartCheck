import { useState, useRef, useCallback, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getRoom, updateRoom, deleteRoom, getPatients } from '../api';
import { useAuth } from '../context/AuthContext';
import { STATUS_LABELS } from '../utils';

function roomUrl(roomId) {
  return `${window.location.origin}${import.meta.env.BASE_URL}rooms/${roomId}`;
}

export default function RoomDetail() {
  const { id }     = useParams();
  const navigate   = useNavigate();
  const { isAdmin, canEdit, canDelete } = useAuth();
  const qrRef      = useRef(null);

  const [room,     setRoom]     = useState(null);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);
  const [error,    setError]    = useState('');
  const [editing,    setEditing]    = useState(false);
  const [editForm,   setEditForm]   = useState({});
  const [saving,     setSaving]     = useState(false);
  const [confirmDel, setConfirmDel] = useState(false);
  const [deleting,   setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const [rRes, pRes] = await Promise.all([getRoom(id), getPatients()]);
      setRoom(rRes.data);
      setPatients(pRes.data);
    } catch (e) {
      setError(e.response?.status === 404 ? 'Палата не найдена' : 'Ошибка загрузки');
    } finally {
      setLoading(false);
    }
  }, [id]);

  useEffect(() => { load(); }, [load]);

  const patientsHere = room
    ? patients.filter((p) => p.room?.trim().toLowerCase() === room.name.trim().toLowerCase())
    : [];

  const downloadQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${room.name}.png`;
    a.click();
  };

  const printQR = () => {
    const canvas = qrRef.current?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>QR — ${room.name}</title>
      <style>body{font-family:sans-serif;text-align:center;padding:40px}h2{margin-bottom:4px}p{color:#666;margin-bottom:20px}img{width:280px;height:280px}</style>
      </head><body>
      <h2>${room.name}</h2>
      <p>${room.floor ? `Этаж ${room.floor}` : ''}</p>
      <img src="${url}" />
      <script>window.onload=()=>{window.print();window.close()}</script>
      </body></html>
    `);
    win.document.close();
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deleteRoom(id);
      navigate('/rooms');
    } finally {
      setDeleting(false);
    }
  };

  const openEdit = () => {
    setEditForm({ name: room.name, floor: room.floor, capacity: room.capacity, description: room.description || '' });
    setEditing(true);
  };

  const saveEdit = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const updated = { ...room, ...editForm, capacity: Number(editForm.capacity) || room.capacity };
      await updateRoom(id, updated);
      setRoom(updated);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-center"><div className="spinner" /><span>Загрузка...</span></div>;
  if (error)   return <div className="alert alert-error" style={{ margin: 28 }}>{error}</div>;
  if (!room)   return null;

  const url = roomUrl(room.id);
  const active = patientsHere.filter((p) => p.status === 'active').length;

  return (
    <div className="fade-up">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link to="/rooms" style={{ color: 'var(--blue-500)', textDecoration: 'none', fontWeight: 600 }}>
          Палаты
        </Link>
        <span>/</span>
        <span>{room.name}</span>
      </div>

      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>{room.name}</h1>
          <p>
            {room.floor && `Этаж ${room.floor}`}
            {room.floor && room.capacity > 0 && ' · '}
            {room.capacity > 0 && `${active}/${room.capacity} занято`}
            {room.description && ` · ${room.description}`}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/rooms" className="btn btn-ghost">← Назад</Link>
          {canEdit   && <button className="btn btn-secondary" onClick={openEdit}>✏️ Редактировать</button>}
          {canDelete && <button className="btn btn-danger" onClick={() => setConfirmDel(true)}>🗑️ Удалить</button>}
        </div>
      </div>

      <div className="room-detail-layout">
        {/* QR block */}
        <div className="card" style={{ width: 280 }}>
          <div className="card-header">
            <span className="card-title">QR-код палаты</span>
          </div>
          <div className="card-body" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 14 }}>
            <div className="room-detail-qr" ref={qrRef}>
              <QRCodeCanvas
                value={url}
                size={200}
                bgColor="#ffffff"
                fgColor="#0d1b2a"
                level="M"
                includeMargin
              />
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center', wordBreak: 'break-all', lineHeight: 1.5 }}>
              {url}
            </div>

            <div style={{ display: 'flex', gap: 8, width: '100%' }}>
              <button className="btn btn-secondary btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={downloadQR}>
                ⬇️ Скачать
              </button>
              <button className="btn btn-ghost btn-sm" style={{ flex: 1, justifyContent: 'center' }} onClick={printQR}>
                🖨️ Печать
              </button>
            </div>

            <div style={{ fontSize: 11, color: 'var(--text-muted)', textAlign: 'center' }}>
              Создан: {new Date(room.createdAt).toLocaleDateString('ru')}
            </div>
          </div>
        </div>

        {/* Patients in room */}
        <div className="card">
          <div className="card-header">
            <span className="card-title">Пациенты в палате</span>
            <span className={`badge ${active > 0 ? 'badge-blue' : 'badge-amber'}`}>
              {patientsHere.length > 0 ? `${patientsHere.length} чел.` : 'Пусто'}
            </span>
          </div>
          <div className="card-body">
            {patientsHere.length === 0 ? (
              <div className="empty-state" style={{ padding: '30px 0' }}>
                <div className="empty-icon">🛏️</div>
                <div className="empty-title">Нет пациентов</div>
                <div className="empty-text">Когда пациент будет добавлен в эту палату — он появится здесь</div>
                {canEdit && <Link to="/patients/new" className="btn btn-primary btn-sm">+ Добавить пациента</Link>}
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {patientsHere.map((p) => {
                  const st = STATUS_LABELS[p.status];
                  return (
                    <Link
                      key={p.id}
                      to={`/patients/${p.id}`}
                      style={{ textDecoration: 'none', color: 'inherit' }}
                    >
                      <div className="room-patient-row">
                        <div className="room-patient-avatar">
                          {p.name.split(' ').map((w) => w[0]).slice(0, 2).join('')}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name}</div>
                          <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>
                            {p.diagnosis}
                            {p.doctor && ` · ${p.doctor}`}
                          </div>
                        </div>
                        {st && <span className={`badge ${st.cls}`}>{st.label}</span>}
                      </div>
                    </Link>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(false)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <span className="modal-title">Удалить палату?</span>
              <button onClick={() => setConfirmDel(false)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                Вы уверены, что хотите удалить <b>{room.name}</b>?
              </p>
              {patientsHere.length > 0 && (
                <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>
                  ⚠️ В палате находится {patientsHere.length} пациент(а).
                  Палата будет удалена, пациенты останутся в базе.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDel(false)}>Отмена</button>
              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Удаление...' : '🗑️ Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit modal */}
      {editing && (
        <div className="modal-overlay" onClick={() => setEditing(false)}>
          <div className="modal" style={{ maxWidth: 440 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <span className="modal-title">Редактировать палату</span>
              <button onClick={() => setEditing(false)}>×</button>
            </div>
            <form onSubmit={saveEdit}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="form-group">
                  <label className="form-label">Название</label>
                  <input
                    className="form-input"
                    value={editForm.name}
                    onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                  />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Этаж</label>
                    <input
                      className="form-input"
                      value={editForm.floor}
                      onChange={(e) => setEditForm((f) => ({ ...f, floor: e.target.value }))}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Вместимость</label>
                    <input
                      className="form-input"
                      type="number" min="1"
                      value={editForm.capacity}
                      onChange={(e) => setEditForm((f) => ({ ...f, capacity: e.target.value }))}
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label className="form-label">Примечание</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    value={editForm.description}
                    onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                  />
                </div>
              </div>
              <div className="modal-footer">
                <button type="button" onClick={() => setEditing(false)}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving ? 'Сохранение...' : '💾 Сохранить'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
