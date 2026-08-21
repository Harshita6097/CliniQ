import { useState } from "react";
import { NavLink, Outlet, useNavigate } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import ChangePasswordModal from "../../components/ChangePasswordModal";

const links = [
  {
    to: "/patient", end: true, label: "Dashboard",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
      </svg>
    ),
  },
  {
    to: "/patient/book", label: "Book Appointment",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
      </svg>
    ),
  },
  {
    to: "/patient/appointments", label: "My Appointments",
    icon: (
      <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
      </svg>
    ),
  },
];

export default function PatientLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [showChangePw, setShowChangePw] = useState(false);

  const handleLogout = () => { logout(); navigate("/login", { replace: true }); };

  const initials = user.name?.split(" ").map(n => n[0]).join("").toUpperCase().slice(0, 2);

  const SidebarContent = () => (
    <>
      {/* Logo / brand */}
      <div className="px-6 py-6">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-teal-400 to-cyan-600 flex items-center justify-center shadow-md">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </div>
          <div>
            <p className="text-sm font-bold text-white leading-tight">HealthCare</p>
            <p className="text-xs text-teal-300 font-medium">Patient Portal</p>
          </div>
        </div>
      </div>

      {/* User card */}
      <button
        onClick={() => setShowChangePw(true)}
        className="mx-4 mb-4 rounded-2xl bg-white/10 border border-white/20 px-4 py-3 text-left hover:bg-white/20 transition-colors w-[calc(100%-2rem)]"
      >
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-300 to-cyan-400 flex items-center justify-center text-teal-900 text-sm font-bold shadow-sm shrink-0">
            {initials}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-white truncate">{user.name}</p>
            <p className="text-xs text-teal-300 truncate">Change password</p>
          </div>
        </div>
      </button>

      {/* Nav */}
      <nav className="flex-1 px-3 space-y-1">
        {links.map(({ to, label, end, icon }) => (
          <NavLink
            key={to} to={to} end={end}
            onClick={() => setMobileOpen(false)}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition-all duration-150 ${
                isActive
                  ? "bg-white/20 text-white shadow-md"
                  : "text-teal-100 hover:bg-white/10 hover:text-white"
              }`
            }
          >
            {icon}
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Sign out */}
      <div className="px-3 py-4 mt-4 border-t border-white/10">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 w-full rounded-xl px-3 py-2.5 text-sm font-medium text-teal-300 hover:bg-white/10 hover:text-red-300 transition-all duration-150"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={1.8} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
          Sign out
        </button>
      </div>
    </>
  );

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-teal-50 via-cyan-50 to-slate-100">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-64 bg-gradient-to-b from-teal-700 via-teal-800 to-cyan-900 flex-col shadow-xl">
        <SidebarContent />
      </aside>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setMobileOpen(false)} />
          <aside className="absolute left-0 top-0 h-full w-64 bg-white flex flex-col shadow-2xl">
            <SidebarContent />
          </aside>
        </div>
      )}

      {/* Main */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Mobile topbar */}
        <header className="md:hidden flex items-center justify-between px-4 py-3 bg-white/80 backdrop-blur-sm border-b border-gray-100">
          <button onClick={() => setMobileOpen(true)} className="p-2 rounded-lg hover:bg-gray-100">
            <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <p className="text-sm font-bold text-gray-800">HealthCare</p>
          <div className="w-8 h-8 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center text-white text-xs font-bold">
            {initials}
          </div>
        </header>

        <main className="flex-1 p-6 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>

      {showChangePw && (
        <ChangePasswordModal accentColor="teal" onClose={() => setShowChangePw(false)} />
      )}
    </div>
  );
}
