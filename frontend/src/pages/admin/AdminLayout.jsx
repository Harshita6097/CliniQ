import { useState } from 'react';
import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import ChangePasswordModal from '../../components/ChangePasswordModal';
import PulseThread from '../../components/common/PulseThread.jsx';

const Logomark = ({ className = 'w-5 h-5' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M2 12h4l2-7 4 14 3-9 2 2h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const links = [
  { to: '/admin', end: true, label: 'Dashboard', icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" /></svg> },
  { to: '/admin/doctors', label: 'Doctors', icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  { to: '/admin/appointments', label: 'Appointments', icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
  { to: '/admin/notifications', label: 'Notifications', icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg> },
  { to: '/admin/settings', label: 'Settings', icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><circle cx="12" cy="12" r="3" /></svg> },
];

export default function AdminLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen]     = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);
  const initials = user.name?.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const handleLogout = () => { logout(); navigate('/login', { replace: true }); };

  const SidebarContent = () => (
    <>
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-md bg-white/20 flex items-center justify-center text-white"><Logomark /></div>
          <div>
            <p className="text-sm font-display font-semibold text-white leading-tight">CliniQ</p>
            <p className="text-xs text-white/60 font-medium">Admin Portal</p>
          </div>
        </div>
      </div>
      <button onClick={() => setShowChangePw(true)} className="mx-4 mb-4 rounded-md bg-white/10 border border-white/20 px-4 py-3 text-left hover:bg-white/20 transition-colors w-[calc(100%-2rem)]" title="Change password">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-admin-light/40 flex items-center justify-center text-white text-sm font-bold shrink-0">{initials}</div>
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-white/60 flex items-center gap-1">
              Change password
              <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            </p>
          </div>
        </div>
      </button>
      <nav className="flex-1 px-3 space-y-0.5">
        {links.map(({ to, label, end, icon }) => (
          <NavLink key={to} to={to} end={end} onClick={() => setMobileOpen(false)}
            className={({ isActive }) => `relative flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition-all duration-150 overflow-hidden ${isActive ? 'bg-white/15 text-white' : 'text-white/70 hover:bg-white/10 hover:text-white'}`}
          >
            {({ isActive }) => (
              <>{isActive && <span className="absolute left-0 top-2 bottom-2 w-[3px] bg-white rounded-r-full" />}{icon}{label}</>
            )}
          </NavLink>
        ))}
      </nav>
      <div className="px-3 py-4 mt-4 border-t border-white/10">
        <button onClick={handleLogout} className="flex items-center gap-3 w-full rounded-md px-3 py-2.5 text-sm font-medium text-white/60 hover:bg-white/10 hover:text-danger-tint transition-all duration-150">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round"><path d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" /></svg>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-paper">
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-admin-dark to-admin flex-col shadow-pop relative overflow-hidden shrink-0">
        <PulseThread color="#ffffff" opacity={0.2} yOffset={230} />
        <div className="relative flex flex-col h-full"><SidebarContent /></div>
      </aside>
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-ink/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-gradient-to-b from-admin-dark to-admin flex flex-col shadow-pop overflow-hidden">
            <PulseThread color="#ffffff" opacity={0.2} yOffset={230} />
            <div className="relative flex flex-col h-full"><SidebarContent /></div>
          </aside>
        </div>
      )}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white border-b border-stone">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-md hover:bg-paper-dim focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-admin" aria-label="Open menu">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-ink" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><path d="M4 6h16M4 12h16M4 18h16" /></svg>
          </button>
          <div className="flex items-center gap-2">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-admin"><path d="M2 12h4l2-7 4 14 3-9 2 2h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
            <span className="font-display font-semibold text-ink text-sm">CliniQ</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-admin flex items-center justify-center text-white text-xs font-bold">{initials}</div>
        </header>
        <main className="flex-1 p-6 md:p-8 overflow-y-auto"><Outlet /></main>
      </div>
      {showChangePw && <ChangePasswordModal accentColor="purple" onClose={() => setShowChangePw(false)} />}
    </div>
  );
}
