import { useState, useEffect } from 'react';
import { NavLink, useNavigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { initials } from '../utils';

const NAV = [
  { to: '/dashboard', icon: <IconGrid />,  label: 'Дашборд' },
  { to: '/patients',  icon: <IconUsers />, label: 'Пациенты' },
  { to: '/rooms',     icon: <IconDoor />,  label: 'Палаты' },
];

const ADMIN_NAV = [
  { to: '/admin', icon: <IconShield />, label: 'Admin Panel' },
];

export default function Layout() {
  const { user, logout, isAdmin, canEdit } = useAuth();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => { logout(); navigate('/login'); };

  const [dark, setDark] = useState(() => localStorage.getItem('sc_theme') === 'dark');
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', dark ? 'dark' : 'light');
    localStorage.setItem('sc_theme', dark ? 'dark' : 'light');
  }, [dark]);

  return (
    <div className="layout">
      {/* Overlay for mobile */}
      <div
        className={`sidebar-overlay${open ? ' visible' : ''}`}
        onClick={() => setOpen(false)}
      />

      {/* Sidebar */}
      <aside className={`sidebar${open ? ' open' : ''}`}>
        <NavLink to="/dashboard" className="sidebar-logo" onClick={() => setOpen(false)}>
          <div className="sidebar-logo-icon">＋</div>
          <span className="sidebar-logo-text">SmartCheck</span>
        </NavLink>

        <nav className="sidebar-nav">
          <div className="sidebar-section-label">Навигация</div>
          {NAV.map(n => (
            <NavLink
              key={n.to} to={n.to} className={({isActive}) => `nav-link${isActive?' active':''}`}
              onClick={() => setOpen(false)}
            >
              {n.icon} {n.label}
            </NavLink>
          ))}

          {canEdit && (
            <>
              <div className="sidebar-section-label" style={{marginTop:8}}>Управление</div>
              {ADMIN_NAV.map(n => (
                <NavLink
                  key={n.to} to={n.to} className={({isActive}) => `nav-link${isActive?' active':''}`}
                  onClick={() => setOpen(false)}
                >
                  {n.icon} {n.label}
                </NavLink>
              ))}
            </>
          )}
        </nav>

        <div className="sidebar-footer">
          <NavLink
            to="/profile"
            className="sidebar-user"
            style={{textDecoration:'none'}}
            onClick={() => setOpen(false)}
          >
            <div className="user-avatar-sm">{initials(user?.name || '')}</div>
            <div className="sidebar-user-info">
              <div className="sidebar-user-name">{user?.name?.split(' ')[0]}</div>
              <div className="sidebar-user-role">
                {user?.role === 'admin' ? 'Администратор' : user?.role === 'doctor' ? 'Врач' : 'Медсестра'}
              </div>
            </div>
          </NavLink>
          <button
            className="btn btn-ghost btn-sm btn-full"
            style={{marginTop:8}}
            onClick={handleLogout}
          >
            <IconLogout /> Выйти
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="main-content">
        <header className="topbar">
          <button className="sidebar-toggle btn-icon-only" onClick={() => setOpen(o => !o)}>
            <IconMenu />
          </button>
          <div className="topbar-actions">
            <div className="theme-switch" onClick={() => setDark(d => !d)} title={dark ? 'Светлая тема' : 'Тёмная тема'}>
              <div className={`theme-switch-track${dark ? ' on' : ''}`}>
                <div className="theme-switch-thumb" />
              </div>
              <span className="theme-switch-icon">{dark ? '🌙' : '☀️'}</span>
            </div>
            <NavLink to="/profile" className="btn btn-ghost btn-sm" style={{textDecoration:'none'}}>
              <div className="user-avatar-sm" style={{width:26,height:26,fontSize:10}}>
                {initials(user?.name || '')}
              </div>
              <span style={{maxWidth:120,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>
                {user?.name?.split(' ').slice(0,2).join(' ')}
              </span>
            </NavLink>
          </div>
        </header>

        <div className="page-content">
          <Outlet />
        </div>
      </div>

      {/* Bottom nav — mobile only */}
      <nav className="bottom-nav">
        <NavLink to="/dashboard" className={({isActive}) => `bnav-item${isActive?' active':''}`} onClick={() => setOpen(false)}>
          <IconGrid />
          <span>Дашборд</span>
        </NavLink>
        <NavLink to="/patients" className={({isActive}) => `bnav-item${isActive?' active':''}`} onClick={() => setOpen(false)}>
          <IconUsers />
          <span>Пациенты</span>
        </NavLink>
        <NavLink to="/rooms" className={({isActive}) => `bnav-item${isActive?' active':''}`} onClick={() => setOpen(false)}>
          <IconDoor />
          <span>Палаты</span>
        </NavLink>
        <NavLink to="/profile" className={({isActive}) => `bnav-item${isActive?' active':''}`} onClick={() => setOpen(false)}>
          <IconPerson />
          <span>Профиль</span>
        </NavLink>
      </nav>
    </div>
  );
}

// ── SVG icons ─────────────────────────────────────────
function IconGrid() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>;
}
function IconUsers() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75"/></svg>;
}
function IconShield() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>;
}
function IconLogout() {
  return <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>;
}
function IconMenu() {
  return <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="18" x2="21" y2="18"/></svg>;
}
function IconDoor() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 21h18M5 21V5a2 2 0 012-2h10a2 2 0 012 2v16"/><path d="M9 21v-4a2 2 0 012-2h2a2 2 0 012 2v4"/></svg>;
}
function IconPerson() {
  return <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>;
}