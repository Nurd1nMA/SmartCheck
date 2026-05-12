import { useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetch } from '../hooks';
import { getPatient, updatePatient, deletePatient } from '../api';
import { initials, STATUS_LABELS } from '../utils';
import { useAuth } from '../context/AuthContext';

export default function PatientDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isAdmin, canEdit, canDelete } = useAuth();

  const [localPatient, setLocalPatient] = useState(null);

  const { loading, error } = useFetch(
    () => getPatient(id),
    [id],
    (data) => setLocalPatient(data)
  );

  const [issuingId, setIssuingId] = useState(null);
  const [deleting, setDeleting] = useState(false);
  const [showDelModal, setShowDelModal] = useState(false);

  const handleIssue = async (medId) => {
    if (!localPatient) return;

    setIssuingId(medId);

    const updatedMeds = localPatient.medications.map((m) =>
      m.id === medId ? { ...m, issued: true } : m
    );

    const updatedPatient = { ...localPatient, medications: updatedMeds };
    setLocalPatient(updatedPatient);

    try {
      await updatePatient(id, updatedPatient);
    } catch {
      setLocalPatient(localPatient);
    } finally {
      setIssuingId(null);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await deletePatient(id);
      navigate('/patients');
    } finally {
      setDeleting(false);
    }
  };

  if (loading && !localPatient)
    return (
      <div className="loading-center">
        <div className="spinner" />
        <span>Загрузка...</span>
      </div>
    );

  if (error && !localPatient)
    return <div className="alert alert-error">{error}</div>;

  if (!localPatient) return null;

  const patient = localPatient;

  const allIssued =
    patient.medications?.every((m) => m.issued) || false;

  const issuedCount =
    patient.medications?.filter((m) => m.issued).length || 0;

  const total = patient.medications?.length || 0;

  const st = STATUS_LABELS[patient.status];

  return (
    <div className="fade-up">
      {/* Breadcrumb */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-muted)', marginBottom: 20 }}>
        <Link to="/patients" style={{ color: 'var(--blue-500)', textDecoration: 'none', fontWeight: 600 }}>
          Пациенты
        </Link>
        <span>/</span>
        <span>{patient.name}</span>
      </div>

      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1 style={{ fontSize: 20 }}>{patient.name}</h1>
          <p>{patient.room} · {patient.diagnosis}</p>
        </div>

        <div style={{ display: 'flex', gap: 10 }}>
          <Link to="/patients" className="btn btn-ghost">← Назад</Link>
          {canEdit && (
            <Link to={`/patients/${id}/edit`} className="btn btn-secondary">
              ✏️ Редактировать
            </Link>
          )}
          {canDelete && (
            <button
              className="btn btn-danger"
              onClick={() => setShowDelModal(true)}
            >
              🗑️ Удалить
            </button>
          )}
        </div>
      </div>

      {/* Hero */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="detail-hero">
          <div className="detail-avatar">{initials(patient.name)}</div>

          <div style={{ flex: 1 }}>
            <div className="detail-name">{patient.name}</div>

            <div className="detail-tags">
              <span className="dtag dtag-blue">🏥 {patient.room}</span>
              {patient.age > 0 && (
                <span className="dtag dtag-muted">{patient.age} лет</span>
              )}
              {patient.bloodType && (
                <span className="dtag dtag-red">🩸 {patient.bloodType}</span>
              )}
              {st && (
                <span className={`badge ${st.cls}`}>{st.label}</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Info */}
      <div className="card" style={{ marginBottom: 20 }}>
        <div className="card-header">
          <span className="card-title">Информация о пациенте</span>
        </div>

        <div className="card-body">
          <div className="info-grid">
            {[
              { label: 'Диагноз', value: patient.diagnosis },
              { label: 'Лечащий врач', value: patient.doctor || '—' },
              { label: 'Дата поступления', value: patient.admittedDate || '—' },
              { label: 'Телефон', value: patient.phone || '—' },
              { label: 'Аллергии', value: patient.allergies || 'Нет' },
              { label: 'Группа крови', value: patient.bloodType || '—' },
            ].map((f) => (
              <div className="info-item" key={f.label}>
                <div className="info-item-label">{f.label}</div>
                <div className="info-item-value">{f.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Medications */}
      <div className="card">
        <div className="card-header">
          <span className="card-title">💊 Назначения</span>
          <span className={`badge ${allIssued ? 'badge-green' : 'badge-amber'}`}>
            {issuedCount}/{total} выдано
          </span>
        </div>

        <div className="card-body">
          {allIssued && (
            <div className="alert alert-success" style={{ marginBottom: 16 }}>
              ✅ Все препараты выданы на сегодня
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {patient.medications?.map((med) => (
              <div
                key={med.id}
                className={`med-item${med.issued ? ' med-item--issued' : ''}`}
              >
                <div style={{ fontSize: 20 }}>💊</div>

                <div className="med-info">
                  <div className="med-name">{med.name}</div>
                  <div className="med-meta">
                    <span className="med-dosage">{med.dosage}</span>
                    <span className="med-time">🕐 {med.time}</span>
                  </div>
                </div>

                {med.issued ? (
                  <div className="issued-mark">✔</div>
                ) : (
                  <button
                    className="issue-btn"
                    onClick={() => handleIssue(med.id)}
                    disabled={issuingId === med.id}
                  >
                    {issuingId === med.id ? '...' : 'Выдать'}
                  </button>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Modal */}
      {showDelModal && (
        <div className="modal-overlay" onClick={() => setShowDelModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-hdr">
              <span className="modal-title">Удалить пациента?</span>
              <button onClick={() => setShowDelModal(false)}>×</button>
            </div>

            <div className="modal-body">
              Вы уверены, что хотите удалить <b>{patient.name}</b>?
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowDelModal(false)}>
                Отмена
              </button>

              <button
                className="btn btn-danger"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? 'Удаление...' : 'Удалить'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}