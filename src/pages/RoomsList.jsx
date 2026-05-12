import { useState, useCallback, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { QRCodeCanvas } from 'qrcode.react';
import { getRooms, createRoom, updateRoom, deleteRoom, getPatients } from '../api';
import { useAuth } from '../context/AuthContext';

function roomUrl(roomId) {
  return `${window.location.origin}${import.meta.env.BASE_URL}rooms/${roomId}`;
}

const EMPTY_FORM = { name: '', floor: '', capacity: '', description: '' };

export default function RoomsList() {
  const { isAdmin, canEdit, canDelete } = useAuth();
  const [rooms,    setRooms]    = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading,  setLoading]  = useState(true);

  // modal: null | { mode: 'create' } | { mode: 'edit', room }
  const [modal,    setModal]    = useState(null);
  const [form,     setForm]     = useState(EMPTY_FORM);
  const [formErr,  setFormErr]  = useState({});
  const [saving,   setSaving]   = useState(false);

  // delete confirm: null | room
  const [confirmDel, setConfirmDel] = useState(null);
  const [deleting,   setDeleting]   = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [rRes, pRes] = await Promise.all([getRooms(), getPatients()]);
      setRooms(rRes.data);
      setPatients(pRes.data);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const patientsInRoom = (roomName) =>
    patients.filter((p) => p.room?.trim().toLowerCase() === roomName.trim().toLowerCase());

  const setF = (k, v) => {
    setForm((f) => ({ ...f, [k]: v }));
    setFormErr((e) => ({ ...e, [k]: '' }));
  };

  const validate = (isEdit = false, editingRoomId = null) => {
    const e = {};
    if (!form.name.trim()) {
      e.name = 'Обязательное поле';
    } else {
      const duplicate = rooms.find(
        (r) => r.name.trim().toLowerCase() === form.name.trim().toLowerCase()
              && r.id !== editingRoomId
      );
      if (duplicate) e.name = 'Палата с таким именем уже существует';
    }
    if (form.capacity && (isNaN(form.capacity) || Number(form.capacity) < 1))
      e.capacity = 'Некорректное число';
    setFormErr(e);
    return Object.keys(e).length === 0;
  };

  const openCreate = () => {
    setForm(EMPTY_FORM);
    setFormErr({});
    setModal({ mode: 'create' });
  };

  const openEdit = (room) => {
    setForm({
      name:        room.name,
      floor:       room.floor ?? '',
      capacity:    room.capacity ?? '',
      description: room.description ?? '',
    });
    setFormErr({});
    setModal({ mode: 'edit', room });
  };

  const closeModal = () => { setModal(null); setFormErr({}); };

  const handleSave = async (e) => {
    e.preventDefault();
    const isEdit = modal?.mode === 'edit';
    if (!validate(isEdit, isEdit ? modal.room.id : null)) return;
    setSaving(true);
    try {
      if (isEdit) {
        const updated = {
          ...modal.room,
          name:        form.name.trim(),
          floor:       form.floor.trim(),
          capacity:    Number(form.capacity) || modal.room.capacity,
          description: form.description.trim(),
        };
        await updateRoom(modal.room.id, updated);
        setRooms((prev) => prev.map((r) => r.id === modal.room.id ? updated : r));
      } else {
        const res = await createRoom({
          id:          `r-${Date.now()}`,
          name:        form.name.trim(),
          floor:       form.floor.trim(),
          capacity:    Number(form.capacity) || 4,
          description: form.description.trim(),
          createdAt:   new Date().toISOString(),
        });
        setRooms((prev) => [...prev, res.data]);
      }
      closeModal();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteConfirmed = async () => {
    if (!confirmDel) return;
    setDeleting(true);
    try {
      await deleteRoom(confirmDel.id);
      setRooms((prev) => prev.filter((r) => r.id !== confirmDel.id));
      setConfirmDel(null);
    } finally {
      setDeleting(false);
    }
  };

  const downloadQR = (room) => {
    const canvas = document.querySelector(`#qr-${room.id} canvas`);
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${room.name}.png`;
    a.click();
  };

  if (loading) return (
    <div className="loading-center">
      <div className="spinner" />
      <span>Загрузка...</span>
    </div>
  );

  return (
    <div className="fade-up">
      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Палаты</h1>
          <p>{rooms.length} палат · QR-коды ссылаются на страницу палаты</p>
        </div>
        {canEdit && (
          <button className="btn btn-primary" onClick={openCreate}>
            + Создать палату
          </button>
        )}
      </div>

      {rooms.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">🏥</div>
          <div className="empty-title">Палат пока нет</div>
          <div className="empty-text">Создайте первую палату — QR-код сгенерируется автоматически</div>
        </div>
      ) : (
        <div className="rooms-grid">
          {rooms.map((room) => {
            const pts    = patientsInRoom(room.name);
            const active = pts.filter((p) => p.status === 'active').length;
            const url    = roomUrl(room.id);
            const full   = room.capacity > 0 && active >= room.capacity;

            return (
              <div key={room.id} className={`room-card${full ? ' room-card--full' : ''}`}>
                {/* Header */}
                <div className="room-card-hdr">
                  <div>
                    <div className="room-name">{room.name}</div>
                    <div className="room-meta">
                      {room.floor && <span>Этаж {room.floor}</span>}
                      {room.floor && room.capacity > 0 && <span>·</span>}
                      {room.capacity > 0 && (
                        <span className={full ? 'room-meta-full' : ''}>
                          {active}/{room.capacity} мест
                        </span>
                      )}
                    </div>
                  </div>
                  <span className={`badge ${active > 0 ? 'badge-blue' : 'badge-amber'}`}>
                    {active > 0 ? `${active} пациент${active === 1 ? '' : 'а'}` : 'Пусто'}
                  </span>
                </div>

                {/* QR */}
                <div className="room-qr-wrap" id={`qr-${room.id}`}>
                  <QRCodeCanvas
                    value={url}
                    size={150}
                    bgColor="#ffffff"
                    fgColor="#0d1b2a"
                    level="M"
                    includeMargin
                  />
                </div>

                <div className="room-qr-hint">Сканируй → откроется страница палаты</div>

                {/* Patients preview */}
                {pts.length > 0 && (
                  <div className="room-patients-preview">
                    {pts.slice(0, 3).map((p) => (
                      <Link key={p.id} to={`/patients/${p.id}`} className="room-patient-chip">
                        <span className={`room-patient-dot ${
                          p.status === 'active'   ? 'dot-blue'  :
                          p.status === 'critical' ? 'dot-red'   : 'dot-muted'
                        }`} />
                        {p.name.split(' ').slice(0, 2).join(' ')}
                      </Link>
                    ))}
                    {pts.length > 3 && (
                      <span className="room-patient-chip room-patient-chip--more">
                        +{pts.length - 3} ещё
                      </span>
                    )}
                  </div>
                )}

                {/* Actions */}
                <div className="room-actions">
                  <Link
                    to={`/rooms/${room.id}`}
                    className="btn btn-primary btn-sm"
                    style={{ flex: 1, justifyContent: 'center' }}
                  >
                    Открыть →
                  </Link>
                  {canEdit && (
                    <button
                      className="btn btn-secondary btn-sm"
                      onClick={() => openEdit(room)}
                      title="Редактировать"
                    >
                      ✏️
                    </button>
                  )}
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => downloadQR(room)}
                    title="Скачать QR"
                  >
                    ⬇️
                  </button>
                  {canDelete && (
                    <button
                      className="btn btn-danger btn-sm"
                      onClick={() => setConfirmDel(room)}
                      title="Удалить палату"
                    >
                      🗑️
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Create / Edit modal */}
      {modal && (
        <div className="modal-overlay" onClick={closeModal}>
          <div className="modal" style={{ maxWidth: 460 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <span className="modal-title">
                {modal.mode === 'edit' ? `Редактировать — ${modal.room.name}` : 'Создать палату'}
              </span>
              <button onClick={closeModal}>×</button>
            </div>

            <form onSubmit={handleSave}>
              <div className="modal-body" style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                <div className="form-group">
                  <label className="form-label">Название *</label>
                  <input
                    className={`form-input${formErr.name ? ' err' : ''}`}
                    placeholder="Палата 305"
                    value={form.name}
                    onChange={(e) => setF('name', e.target.value)}
                    autoFocus
                  />
                  {formErr.name && <div className="field-error">{formErr.name}</div>}
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label className="form-label">Этаж</label>
                    <input
                      className="form-input"
                      placeholder="2"
                      value={form.floor}
                      onChange={(e) => setF('floor', e.target.value)}
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Вместимость</label>
                    <input
                      className={`form-input${formErr.capacity ? ' err' : ''}`}
                      type="number" min="1" placeholder="4"
                      value={form.capacity}
                      onChange={(e) => setF('capacity', e.target.value)}
                    />
                    {formErr.capacity && <div className="field-error">{formErr.capacity}</div>}
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Примечание</label>
                  <textarea
                    className="form-textarea"
                    rows={2}
                    placeholder="Дополнительная информация..."
                    value={form.description}
                    onChange={(e) => setF('description', e.target.value)}
                  />
                </div>

                {modal.mode === 'create' && (
                  <div className="alert alert-info" style={{ marginBottom: 0, fontSize: 12 }}>
                    QR-код сгенерируется автоматически после создания
                  </div>
                )}
              </div>

              <div className="modal-footer">
                <button type="button" onClick={closeModal}>Отмена</button>
                <button type="submit" className="btn btn-primary" disabled={saving}>
                  {saving
                    ? <><span className="spinner-sm" /> Сохранение...</>
                    : modal.mode === 'edit' ? '💾 Сохранить' : '+ Создать'
                  }
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete confirmation modal */}
      {confirmDel && (
        <div className="modal-overlay" onClick={() => setConfirmDel(null)}>
          <div className="modal" style={{ maxWidth: 420 }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <span className="modal-title">Удалить палату?</span>
              <button onClick={() => setConfirmDel(null)}>×</button>
            </div>
            <div className="modal-body">
              <p style={{ fontSize: 14, lineHeight: 1.6 }}>
                Вы уверены, что хотите удалить <b>{confirmDel.name}</b>?
              </p>
              {patientsInRoom(confirmDel.name).length > 0 && (
                <div className="alert alert-error" style={{ marginTop: 12, marginBottom: 0 }}>
                  ⚠️ В этой палате есть пациенты ({patientsInRoom(confirmDel.name).length} чел.).
                  Палата будет удалена, пациенты останутся в базе.
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button onClick={() => setConfirmDel(null)}>Отмена</button>
              <button
                className="btn btn-danger"
                onClick={handleDeleteConfirmed}
                disabled={deleting}
              >
                {deleting ? 'Удаление...' : '🗑️ Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
