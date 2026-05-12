import { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { useFetch } from '../hooks';
import { getPatient, updatePatient, getRooms, createRoom } from '../api';
import PatientForm from '../components/PatientForm';

export default function PatientEdit() {
  const { id }   = useParams();
  const navigate = useNavigate();

  const { data: patient, loading: fetching, error: fetchError } = useFetch(() => getPatient(id), [id]);
  const [saving, setSaving] = useState(false);
  const [error,  setError]  = useState('');
  const [rooms,  setRooms]  = useState([]);

  useEffect(() => {
    getRooms().then((res) => setRooms(res.data)).catch(() => {});
  }, []);

  const normalizeRoom = (name) => {
    const t = name?.trim() || '';
    return /^\d+$/.test(t) ? `Палата ${t}` : t;
  };

  const handleSubmit = async (rawData) => {
    const data = { ...rawData, room: normalizeRoom(rawData.room) };
    setSaving(true);
    setError('');
    try {
      await updatePatient(id, { ...data, id });

      // Auto-sync: if room name changed and doesn't exist yet — create it
      if (data.room?.trim()) {
        const exists = rooms.some(
          (r) => r.name.trim().toLowerCase() === data.room.trim().toLowerCase()
        );
        if (!exists) {
          try {
            const newRoom = await createRoom({
              id:          `r-${Date.now()}`,
              name:        data.room.trim(),
              floor:       '',
              capacity:    4,
              description: '',
              createdAt:   new Date().toISOString(),
            });
            setRooms((prev) => [...prev, newRoom.data]);
          } catch {
            // room sync failure should not block patient update
          }
        }
      }

      navigate(`/patients/${id}`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Ошибка при сохранении');
      setSaving(false);
    }
  };

  if (fetching) return <div className="loading-center"><div className="spinner" /><span>Загрузка данных...</span></div>;
  if (fetchError) return <div className="alert alert-error">{fetchError}</div>;
  if (!patient)   return null;

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>
        <Link to="/patients" style={{ color:'var(--blue-500)', textDecoration:'none', fontWeight:600 }}>Пациенты</Link>
        <span>/</span>
        <Link to={`/patients/${id}`} style={{ color:'var(--blue-500)', textDecoration:'none', fontWeight:600 }}>{patient.name}</Link>
        <span>/</span>
        <span>Редактирование</span>
      </div>

      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Редактирование</h1>
          <p>{patient.name}</p>
        </div>
        <Link to={`/patients/${id}`} className="btn btn-ghost">← Отмена</Link>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-header">
          <span className="card-title">✏️ Изменение карты пациента</span>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <PatientForm initial={patient} onSubmit={handleSubmit} loading={saving} rooms={rooms} />
        </div>
      </div>
    </div>
  );
}
