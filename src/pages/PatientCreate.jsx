import { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { createPatient, getRooms, createRoom } from '../api';
import PatientForm from '../components/PatientForm';

export default function PatientCreate() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState('');
  const [rooms,   setRooms]   = useState([]);

  useEffect(() => {
    getRooms().then((res) => setRooms(res.data)).catch(() => {});
  }, []);

  const handleSubmit = async (data) => {
    setLoading(true);
    setError('');
    try {
      const res = await createPatient({ ...data, id: Date.now().toString() });

      // Auto-sync: if the room doesn't exist yet — create it
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
            // room sync failure should not block patient creation
          }
        }
      }

      navigate(`/patients/${res.data.id}`);
    } catch (e) {
      setError(e.response?.data?.message || e.message || 'Ошибка при создании');
      setLoading(false);
    }
  };

  return (
    <div className="fade-up">
      <div style={{ display:'flex', alignItems:'center', gap:8, fontSize:13, color:'var(--text-muted)', marginBottom:20 }}>
        <Link to="/patients" style={{ color:'var(--blue-500)', textDecoration:'none', fontWeight:600 }}>Пациенты</Link>
        <span>/</span>
        <span>Новый пациент</span>
      </div>

      <div className="page-hdr">
        <div className="page-hdr-left">
          <h1>Новый пациент</h1>
          <p>Заполните данные для создания карты пациента</p>
        </div>
        <Link to="/patients" className="btn btn-ghost">← Отмена</Link>
      </div>

      <div className="card" style={{ maxWidth: 720 }}>
        <div className="card-header">
          <span className="card-title">📋 Карта пациента</span>
        </div>
        <div className="card-body">
          {error && <div className="alert alert-error">{error}</div>}
          <PatientForm onSubmit={handleSubmit} loading={loading} rooms={rooms} />
        </div>
      </div>
    </div>
  );
}
