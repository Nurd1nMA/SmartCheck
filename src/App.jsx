import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Layout        from './components/Layout';

import Home          from './pages/Home';
import Login         from './pages/Login';
import Register      from './pages/Register';
import Dashboard     from './pages/Dashboard';
import PatientsList  from './pages/PatientsList';
import PatientDetail from './pages/PatientDetail';
import PatientCreate from './pages/PatientCreate';
import PatientEdit   from './pages/PatientEdit';
import Profile       from './pages/Profile';
import AdminPanel    from './pages/AdminPanel';
import RoomsList     from './pages/RoomsList';
import RoomDetail    from './pages/RoomDetail';
import NotFound      from './pages/NotFound';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Routes>
          {/* Public routes */}
          <Route path="/"         element={<Home />} />
          <Route path="/login"    element={<Login />} />
          <Route path="/register" element={<Register />} />

          {/* Protected routes — need auth */}
          <Route element={
            <ProtectedRoute>
              <Layout />
            </ProtectedRoute>
          }>
            <Route path="/dashboard"           element={<Dashboard />} />
            <Route path="/patients"            element={<PatientsList />} />
            <Route path="/patients/new" element={
              <ProtectedRoute roles={['admin','doctor']}>
                <PatientCreate />
              </ProtectedRoute>
            }/>
            <Route path="/patients/:id"        element={<PatientDetail />} />
            <Route path="/patients/:id/edit" element={
              <ProtectedRoute roles={['admin','doctor']}>
                <PatientEdit />
              </ProtectedRoute>
            }/>
            <Route path="/profile"             element={<Profile />} />
            <Route path="/rooms"               element={<RoomsList />} />
            <Route path="/rooms/:id"           element={<RoomDetail />} />

            {/* Admin + Doctor */}
            <Route path="/admin" element={
              <ProtectedRoute roles={['admin','doctor']}>
                <AdminPanel />
              </ProtectedRoute>
            }/>
          </Route>

          {/* 404 */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}