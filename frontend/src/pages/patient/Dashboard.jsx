import { Link } from 'react-router-dom';
import { useAppointments } from '../../hooks/useAppointments';
import useAuth from '../../hooks/useAuth';
import { slotLabel } from '../../utils/dateUtils';
import { StatusBadge, SkeletonLoader } from '../../components/common/index.jsx';
import PulseThread from '../../components/common/PulseThread.jsx';

// Medical stat icons
const PulseIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M2 12h4l2-7 4 14 3-9 2 2h5" />
  </svg>
);
const ClipboardCheckIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
  </svg>
);
const CalendarIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
  </svg>
);

function StatCard({ label, value, icon, tint, textColor }) {
  return (
    <div className={`rounded-lg p-5 ${tint} flex items-center gap-4 border border-stone/50`}>
      <div className={`w-11 h-11 rounded-md bg-white/60 flex items-center justify-center ${textColor} shadow-soft`}>
        {icon}
      </div>
      <div>
        <p className={`font-mono text-2xl font-bold ${textColor}`}>{value}</p>
        <p className={`text-xs font-semibold ${textColor} opacity-80`}>{label}</p>
      </div>
    </div>
  );
}

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data: appointments = [], isLoading } = useAppointments();

  const upcoming  = appointments.filter(a => a.status === 'confirmed' && new Date(a.slotStart) > new Date());
  const completed = appointments.filter(a => a.status === 'completed');
  const recent    = upcoming.slice(0, 5);
  const nextAppt  = upcoming[0];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative rounded-lg bg-patient-dark p-8 overflow-hidden shadow-pop">
        <PulseThread color="#ffffff" opacity={0.25} yOffset={240} />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">{greeting}</p>
          <h1 className="font-display text-3xl font-semibold text-white mb-2">{user.name}</h1>
          <p className="text-white/80 text-sm mb-6">Your health is our priority. How can we help you today?</p>
          {nextAppt && (
            <div className="mb-5 inline-flex items-center gap-2 bg-white/15 border border-white/30 rounded-md px-4 py-2 text-white text-sm">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                <circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" />
              </svg>
              Next: {nextAppt.doctorId?.name} — <span className="font-mono text-xs">{slotLabel(nextAppt.slotStart)}</span>
            </div>
          )}
          <div className="flex flex-wrap gap-3">
            <Link to="/patient/book" className="inline-flex items-center gap-2 rounded-xl bg-white text-patient-dark font-bold text-sm px-5 py-2.5 hover:bg-patient-tint transition-all duration-150 shadow-soft hover:shadow-pop hover:-translate-y-0.5">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M12 4v16m8-8H4" /></svg>
              Book Appointment
            </Link>
            <Link to="/patient/appointments" className="inline-flex items-center gap-2 rounded-xl bg-white/20 text-white font-bold text-sm px-5 py-2.5 hover:bg-white/30 transition-all duration-150 border border-white/30">
              View All
            </Link>
          </div>
        </div>
      </div>
      {isLoading ? <SkeletonLoader variant="stat" count={3} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <StatCard label="Upcoming"  value={upcoming.length}      icon={<PulseIcon />}         tint="bg-patient-tint"  textColor="text-patient-dark" />
          <StatCard label="Completed" value={completed.length}     icon={<ClipboardCheckIcon />} tint="bg-sage-tint"     textColor="text-[#3a5c38]" />
          <StatCard label="Total"     value={appointments.length}  icon={<CalendarIcon />}       tint="bg-paper-dim"     textColor="text-ink-soft" />
        </div>
      )}

      {/* Upcoming list */}
      <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-stone bg-paper-dim flex items-center justify-between">
          <div>
            <h2 className="font-display text-base font-semibold text-ink">Upcoming Appointments</h2>
            <p className="text-xs text-ink-soft mt-0.5">Your next scheduled visits</p>
          </div>
          <Link to="/patient/appointments" className="text-xs font-semibold text-patient-dark hover:underline">View all →</Link>
        </div>

        {isLoading ? (
          <div className="p-6"><SkeletonLoader variant="row" count={3} /></div>
        ) : recent.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-stone-dark mx-auto mb-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" />
            </svg>
            <p className="text-sm font-semibold text-ink-soft">No upcoming appointments</p>
            <p className="text-xs text-stone-dark mt-1">Book one to get started</p>
            <Link to="/patient/book" className="inline-block mt-4 text-sm font-semibold text-patient-dark hover:underline">Book now →</Link>
          </div>
        ) : (
          <ul className="divide-y divide-stone/50">
            {recent.map((appt, i) => (
              <li key={appt._id} className="px-6 py-4 flex items-center justify-between hover:bg-paper-dim transition-colors duration-150" style={{ animationDelay: `${i * 60}ms` }}>
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-md bg-patient-tint flex items-center justify-center text-patient-dark font-display font-bold text-sm shadow-soft shrink-0">
                    {appt.doctorId?.name?.[0] ?? 'D'}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-ink">{appt.doctorId?.name}</p>
                    <p className="font-mono text-xs text-ink-soft mt-0.5">{slotLabel(appt.slotStart)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <StatusBadge status={appt.status} />
                  <Link to={`/patient/appointments/${appt._id}`} className="text-xs font-semibold text-patient hover:text-patient-dark bg-patient-tint hover:bg-patient-tint2 px-3 py-1.5 rounded-md transition-colors">
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
