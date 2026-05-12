import { useState, useRef, useEffect, useCallback } from 'react';
import { QRCodeCanvas } from 'qrcode.react';
import { getPatients, getRoomQrCodes, createRoomQrCode, updateRoomQrCode } from '../api';

const FIELD_OPTIONS = [
  { key: 'name',         label: 'Имя пациента' },
  { key: 'room',         label: 'Палата' },
  { key: 'age',          label: 'Возраст' },
  { key: 'diagnosis',    label: 'Диагноз' },
  { key: 'doctor',       label: 'Лечащий врач' },
  { key: 'bloodType',    label: 'Группа крови' },
  { key: 'allergies',    label: 'Аллергии' },
  { key: 'phone',        label: 'Телефон' },
  { key: 'admittedDate', label: 'Дата поступления' },
  { key: 'medications',  label: 'Назначения' },
];

const DEFAULT_FIELDS = ['name', 'room', 'diagnosis', 'doctor', 'bloodType', 'allergies', 'medications'];

function buildQrText(patient, fields, note) {
  const lines = [];
  if (fields.includes('name'))                         lines.push(`Пациент: ${patient.name}`);
  if (fields.includes('room'))                         lines.push(`Палата: ${patient.room}`);
  if (fields.includes('age') && patient.age)           lines.push(`Возраст: ${patient.age} лет`);
  if (fields.includes('diagnosis'))                    lines.push(`Диагноз: ${patient.diagnosis}`);
  if (fields.includes('doctor') && patient.doctor)     lines.push(`Врач: ${patient.doctor}`);
  if (fields.includes('bloodType') && patient.bloodType) lines.push(`Группа крови: ${patient.bloodType}`);
  if (fields.includes('allergies'))                    lines.push(`Аллергии: ${patient.allergies || 'Нет'}`);
  if (fields.includes('phone') && patient.phone)       lines.push(`Тел: ${patient.phone}`);
  if (fields.includes('admittedDate') && patient.admittedDate) lines.push(`Поступил: ${patient.admittedDate}`);
  if (fields.includes('medications') && patient.medications?.length) {
    lines.push('Препараты:');
    patient.medications.forEach((m) => lines.push(`  ${m.name} ${m.dosage} (${m.time})`));
  }
  if (note?.trim()) lines.push(`\nПримечание: ${note.trim()}`);
  return lines.join('\n');
}

export default function RoomsQR() {
  const [patients, setPatients]     = useState([]);
  const [qrConfigs, setQrConfigs]   = useState({});
  const [loading, setLoading]       = useState(true);
  const [editingRoom, setEditingRoom] = useState(null);
  const [tempFields, setTempFields] = useState(DEFAULT_FIELDS);
  const [tempNote, setTempNote]     = useState('');
  const [saving, setSaving]         = useState(false);
  const [saved, setSaved]           = useState(false);
  const qrRefs = useRef({});

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [pRes, qRes] = await Promise.all([getPatients(), getRoomQrCodes()]);
      setPatients(pRes.data.filter((p) => p.status === 'active'));
      const cfgMap = {};
      qRes.data.forEach((cfg) => { cfgMap[cfg.room] = cfg; });
      setQrConfigs(cfgMap);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  const openEdit = (room, patient) => {
    const cfg = qrConfigs[room];
    setTempFields(cfg?.fields ?? DEFAULT_FIELDS);
    setTempNote(cfg?.note ?? '');
    setSaved(false);
    setEditingRoom({ room, patient });
  };

  const toggleField = (key, checked) => {
    setSaved(false);
    setTempFields((prev) => checked ? [...prev, key] : prev.filter((x) => x !== key));
  };

  const saveConfig = async () => {
    if (!editingRoom) return;
    setSaving(true);
    const { room, patient } = editingRoom;
    const existing = qrConfigs[room];
    const data = {
      room,
      patientId: patient.id,
      fields: tempFields,
      note: tempNote,
      generatedAt: new Date().toISOString(),
    };
    try {
      if (existing) {
        await updateRoomQrCode(existing.id, { ...existing, ...data });
        setQrConfigs((prev) => ({ ...prev, [room]: { ...existing, ...data } }));
      } else {
        const res = await createRoomQrCode({ ...data, id: `qr-${Date.now()}` });
        setQrConfigs((prev) => ({ ...prev, [room]: res.data }));
      }
      setSaved(true);
    } finally {
      setSaving(false);
    }
  };

  const downloadQR = (room) => {
    const canvas = qrRefs.current[room]?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `QR-${room}.png`;
    a.click();
  };

  const printQR = (room, patient) => {
    const canvas = qrRefs.current[room]?.querySelector('canvas');
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const win = window.open('', '_blank');
    win.document.write(`
      <!DOCTYPE html><html><head><title>QR — ${room}</title>
      <style>
        body { font-family: sans-serif; text-align: center; padding: 40px; }
        h2   { margin-bottom: 4px; }
        p    { color: #555; margin-bottom: 20px; }
        img  { display: block; margin: 0 auto; width: 260px; height: 260px; }
      </style></head><body>
      <h2>${room}</h2>
      <p>${patient.name}</p>
      <img src="${url}" />
      <script>window.onload = () => { window.print(); window.close(); }</script>
      </body></html>
    `);
    win.document.close();
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
          <h1>QR-коды палат</h1>
          <p>Генерация и управление QR-кодами для каждой палаты</p>
        </div>
      </div>

      {patients.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📭</div>
          <div className="empty-title">Нет активных пациентов</div>
          <div className="empty-text">QR-коды генерируются для палат с активными пациентами</div>
        </div>
      ) : (
        <div className="qr-grid">
          {patients.map((patient) => {
            const cfg    = qrConfigs[patient.room];
            const fields = cfg?.fields ?? DEFAULT_FIELDS;
            const note   = cfg?.note   ?? '';
            const qrText = buildQrText(patient, fields, note);

            return (
              <div key={patient.id} className="qr-card">
                <div className="qr-card-header">
                  <div>
                    <div className="qr-room-name">{patient.room}</div>
                    <div className="qr-patient-name">{patient.name}</div>
                  </div>
                  {cfg && (
                    <span className="badge badge-green" style={{ fontSize: 10 }}>
                      Сохранён
                    </span>
                  )}
                </div>

                <div
                  className="qr-code-wrap"
                  ref={(el) => { qrRefs.current[patient.room] = el; }}
                >
                  <QRCodeCanvas
                    value={qrText}
                    size={190}
                    bgColor="#ffffff"
                    fgColor="#0d1b2a"
                    level="M"
                    includeMargin
                  />
                </div>

                {cfg?.generatedAt && (
                  <div className="qr-timestamp">
                    Обновлён: {new Date(cfg.generatedAt).toLocaleString('ru')}
                  </div>
                )}

                <div className="qr-actions">
                  <button
                    className="btn btn-secondary btn-sm"
                    onClick={() => openEdit(patient.room, patient)}
                  >
                    ✏️ Настроить
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => downloadQR(patient.room)}
                  >
                    ⬇️ Скачать
                  </button>
                  <button
                    className="btn btn-ghost btn-sm"
                    onClick={() => printQR(patient.room, patient)}
                  >
                    🖨️ Печать
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Edit Modal */}
      {editingRoom && (
        <div className="modal-overlay" onClick={() => setEditingRoom(null)}>
          <div
            className="modal"
            style={{ maxWidth: 580 }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-hdr">
              <span className="modal-title">
                Настройка QR — {editingRoom.room}
              </span>
              <button onClick={() => setEditingRoom(null)}>×</button>
            </div>

            <div className="modal-body">
              <div className="qr-edit-layout">
                {/* Live QR preview */}
                <div className="qr-preview-col">
                  <QRCodeCanvas
                    value={buildQrText(editingRoom.patient, tempFields, tempNote)}
                    size={170}
                    bgColor="#ffffff"
                    fgColor="#0d1b2a"
                    level="M"
                    includeMargin
                  />
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 6 }}>
                    Предпросмотр
                  </div>
                </div>

                {/* Field selector + note */}
                <div className="qr-fields-col">
                  <div className="form-label" style={{ marginBottom: 10 }}>
                    Поля для QR-кода
                  </div>
                  <div className="qr-field-list">
                    {FIELD_OPTIONS.map((f) => (
                      <label key={f.key} className="qr-field-item">
                        <input
                          type="checkbox"
                          checked={tempFields.includes(f.key)}
                          onChange={(e) => toggleField(f.key, e.target.checked)}
                          style={{ accentColor: 'var(--blue-500)', width: 15, height: 15 }}
                        />
                        {f.label}
                      </label>
                    ))}
                  </div>

                  <div className="form-group" style={{ marginTop: 14 }}>
                    <label className="form-label">Примечание</label>
                    <textarea
                      className="form-textarea"
                      rows={2}
                      placeholder="Дополнительная информация..."
                      value={tempNote}
                      onChange={(e) => { setTempNote(e.target.value); setSaved(false); }}
                    />
                  </div>
                </div>
              </div>

              {saved && (
                <div className="alert alert-success" style={{ marginTop: 12, marginBottom: 0 }}>
                  ✅ Конфигурация сохранена в базу данных
                </div>
              )}
            </div>

            <div className="modal-footer">
              <button onClick={() => setEditingRoom(null)}>Закрыть</button>
              <button
                className="btn btn-primary"
                onClick={saveConfig}
                disabled={saving}
              >
                {saving ? <><span className="spinner-sm" /> Сохранение...</> : '💾 Сохранить в БД'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
