import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getDoctorAppointments } from '../../api/doctor.api';
import { slotLabel, formatDate } from '../../utils/dateUtils';
import { StatusBadge, SkeletonLoader } from '../../components/common/index.jsx';
import AppointmentRow from '../../components/appointments/AppointmentRow.jsx';
import { isToday } from 'date-fns';
import useAuth from '../../hooks/useAuth';
import PulseThread from '../../components/common/PulseThread.jsx';

const TABS = ['Today', 'Upcoming', 'All'];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [tab, setTab]       = useState('Today');
  const [search, setSearch] = useState('');

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctorAppointments', 'all'],
    queryFn: () => getDoctorAppointments(),
  });

  const todayList    = appointments.filter(a => isToday(new Date(a.slotStart)) && a.status === 'confirmed');
  const upcomingList = appointments.filter(a => a.status === 'confirmed' && new Date(a.slotStart) > new Date());
  const completed    = appointments.filter(a => a.status === 'completed');

  const allFiltered = appointments.filter(a => {
    if (!search) return true;
    return a.patientId?.name?.toLowerCase().includes(search.toLowerCase());
  });

  const tabData = { Today: todayList, Upcoming: upcomingList, All: allFiltered };
  const displayed = tabData[tab] ?? [];

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative rounded-lg bg-doctor-dark p-8 overflow-hidden shadow-pop">
        <PulseThread color="#ffffff" opacity={0.25} />
        <div className="relative">
          <p className="text-white/70 text-sm font-medium mb-1">{greeting}, Dr. {user.name?.split(' ')[0]}</p>
          <h1 className="font-display text-3xl font-semibold text-white mb-1">Your Schedule</h1>
          <p className="font-mono text-xs text-white/70">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? <SkeletonLoader variant="stat" count={3} /> : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {[
            { label: "Today's Patients", value: todayList.length,   tint: 'bg-doctor-tint',  text: 'text-doctor-dark',
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-7 4 14 3-9 2 2h5" /></svg> },
            { label: 'Upcoming',         value: upcomingList.length, tint: 'bg-warn-tint',   text: 'text-doctor-dark',
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg> },
            { label: 'Completed',        value: completed.length,    tint: 'bg-sage-tint',  text: 'text-[#3a5c38]',
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" /></svg> },
          ].map(({ label, value, tint, text, icon }) => (
            <div key={label} className={`rounded-lg p-5 ${tint} flex items-center gap-4 border border-stone/50`}>
              <div className={`w-11 h-11 rounded-md bg-white/60 flex items-center justify-center ${text} shadow-soft`}>{icon}</div>
              <div>
                <p className={`font-mono text-2xl font-bold ${text}`}>{value}</p>
                <p className={`text-xs font-semibold ${text} opacity-80`}>{label}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Tabs */}
      <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
        <div className="flex border-b border-stone">
          {TABS.map(t => (
            <button
              key={t} onClick={() => setTab(t)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                tab === t ? 'text-doctor border-doctor bg-doctor-tint/30' : 'text-ink-soft border-transparent hover:text-ink hover:bg-paper-dim'
              }`}
            >
              {t}
              {t === 'Today' && todayList.length > 0 && (
                <span className="ml-1.5 font-mono text-[10px] bg-doctor text-white px-1.5 py-0.5 rounded-full">{todayList.length}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'All' && (
          <div className="px-5 py-3 border-b border-stone">
            <div className="relative max-w-xs">
              <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-dark" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
              <input
                type="text" placeholder="Search patient…" value={search}
                onChange={e => setSearch(e.target.value)}
                className="w-full rounded-md border border-stone pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doctor bg-paper focus:bg-white text-ink"
              />
            </div>
          </div>
        )}

        {isLoading ? (
          <div className="p-6"><SkeletonLoader variant="row" count={4} /></div>
        ) : displayed.length === 0 ? (
          <div className="py-12 text-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-stone-dark mx-auto mb-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            <p className="text-sm text-ink-soft font-semibold">
              {tab === 'Today' ? 'No appointments today' : tab === 'Upcoming' ? 'No upcoming appointments' : 'No appointments found'}
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone/50">
            {displayed.map(appt => (
              <AppointmentRow key={appt._id} appt={appt} viewHref={`/doctor/appointments/${appt._id}`} portal="doctor" />
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
