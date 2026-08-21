import { Link } from "react-router-dom";
import { useAppointments } from "../../hooks/useAppointments";
import useAuth from "../../hooks/useAuth";
import { slotLabel } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";

const StatCard = ({ label, value, color, icon }) => (
  <div className={`rounded-2xl p-5 ${color} flex items-center gap-4`}>
    <div className="w-12 h-12 rounded-xl bg-white/40 flex items-center justify-center text-2xl shadow-sm">
      {icon}
    </div>
    <div>
      <p className="text-3xl font-bold text-white">{value}</p>
      <p className="text-sm text-white/80 font-medium">{label}</p>
    </div>
  </div>
);

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data: appointments = [], isLoading } = useAppointments();

  const upcoming  = appointments.filter(a => a.status === "confirmed" && new Date(a.slotStart) > new Date());
  const completed = appointments.filter(a => a.status === "completed");
  const recent    = upcoming.slice(0, 5);

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative rounded-3xl bg-gradient-to-r from-teal-500 via-teal-600 to-cyan-600 p-8 overflow-hidden shadow-xl shadow-teal-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-teal-100 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-bold text-white mb-2">{user.name}</h1>
          <p className="text-teal-100 text-sm mb-6">Your health is our priority. How can we help you today?</p>
          <div className="flex flex-wrap gap-3">
            <Link
              to="/patient/book"
              className="inline-flex items-center gap-2 rounded-xl bg-white text-teal-700 font-semibold text-sm px-5 py-2.5 hover:bg-teal-50 transition-all duration-150 shadow-md hover:shadow-lg hover:-translate-y-0.5"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Book Appointment
            </Link>
            <Link
              to="/patient/appointments"
              className="inline-flex items-center gap-2 rounded-xl bg-white/20 text-white font-semibold text-sm px-5 py-2.5 hover:bg-white/30 transition-all duration-150 border border-white/30"
            >
              View All
            </Link>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <StatCard label="Upcoming"  value={upcoming.length}  color="bg-gradient-to-br from-teal-400 to-teal-600"   icon="📅" />
        <StatCard label="Completed" value={completed.length} color="bg-gradient-to-br from-emerald-400 to-emerald-600" icon="✅" />
        <StatCard label="Total"     value={appointments.length} color="bg-gradient-to-br from-cyan-400 to-cyan-600"  icon="📋" />
      </div>

      {/* Upcoming appointments */}
      <div className="bg-white rounded-3xl shadow-md border border-teal-100 overflow-hidden">
        <div className="px-6 py-5 border-b border-teal-50 bg-gradient-to-r from-teal-50 to-cyan-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Upcoming Appointments</h2>
            <p className="text-xs text-gray-400 mt-0.5">Your next scheduled visits</p>
          </div>
          <Link to="/patient/appointments" className="text-xs font-medium text-teal-600 hover:text-teal-700 hover:underline">
            View all →
          </Link>
        </div>

        {isLoading ? (
          <div className="px-6 py-12 flex items-center justify-center">
            <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-sm font-medium text-gray-500">No upcoming appointments</p>
            <p className="text-xs text-gray-400 mt-1">Book one to get started</p>
            <Link
              to="/patient/book"
              className="inline-block mt-4 text-sm font-medium text-teal-600 hover:underline"
            >
              Book now →
            </Link>
          </div>
        ) : (
          <ul className="divide-y divide-gray-50">
            {recent.map((appt, i) => (
              <li
                key={appt._id}
                className="px-6 py-4 flex items-center justify-between hover:bg-teal-50/60 transition-colors duration-150 group border-b border-teal-50/80 last:border-0"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-teal-600 font-bold text-sm shadow-sm">
                    {appt.doctorId?.name?.[0] ?? "D"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">Dr. {appt.doctorId?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{slotLabel(appt.slotStart)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                    {statusLabel(appt.status)}
                  </span>
                  <Link
                    to={`/patient/appointments/${appt._id}`}
                    className="text-xs font-medium text-teal-600 hover:text-teal-700 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    View →
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
