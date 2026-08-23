import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDoctorProfile, markLeave, removeLeave } from '../../api/doctor.api';
import { format, parseISO } from 'date-fns';
import toast from 'react-hot-toast';
import { SkeletonLoader } from '../../components/common/index.jsx';

export default function LeaveManager() {
  const today = new Date().toISOString().slice(0, 10);
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState('');
  const [pendingDates, setPending]      = useState([]);
  const [conflictInfo, setConflictInfo] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ['doctorProfile'],
    queryFn: getDoctorProfile,
  });

  const { mutate: addLeave, isPending: adding } = useMutation({
    mutationFn: dates => markLeave(dates),
    onSuccess: data => {
      queryClient.invalidateQueries({ queryKey: ['doctorProfile'] });
      setPending([]); setSelectedDate('');
      if (data.cancelledAppointments?.length > 0) {
        setConflictInfo(data.cancelledAppointments);
        toast.success(`Leave saved. ${data.cancelledAppointments.length} appointment(s) cancelled.`);
      } else { toast.success('Leave days saved.'); }
    },
    onError: err => toast.error(err.response?.data?.message || 'Failed to save leave.'),
  });

  const { mutate: deleteLeave, isPending: removing } = useMutation({
    mutationFn: dates => removeLeave(dates),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['doctorProfile'] }); toast.success('Leave day removed.'); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to remove leave.'),
  });

  const stageDate = () => {
    if (!selectedDate) return;
    if (pendingDates.includes(selectedDate)) { toast.error('Date already staged.'); return; }
    if (profile?.leaveDays?.includes(selectedDate)) { toast.error('Already a leave day.'); return; }
    setPending(p => [...p, selectedDate].sort());
    setSelectedDate('');
  };

  if (isLoading) return <div className="p-8"><SkeletonLoader variant="card" count={2} /></div>;

  const leaveDays = [...(profile?.leaveDays ?? [])].sort();

  return (
    <div className="max-w-5xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Leave Manager</h1>
        <p className="text-sm text-ink-soft mt-1">Mark days off — confirmed appointments on those days will be cancelled and patients notified.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">

      {/* Left column — Add leave */}
      <div className="space-y-6">
      <div className="bg-white rounded-lg border border-stone shadow-soft p-6 space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-stone">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-doctor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <h2 className="text-sm font-semibold text-ink">Add Leave Days</h2>
        </div>
        <div className="flex gap-3 flex-wrap">
          <input
            type="date" value={selectedDate} min={today}
            onChange={e => setSelectedDate(e.target.value)}
            className="rounded-md border border-stone px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-doctor bg-paper focus:bg-white text-ink"
          />
          <button onClick={stageDate} disabled={!selectedDate}
            className="rounded-md bg-doctor-tint hover:bg-doctor-tint2 disabled:opacity-50 text-doctor-dark font-semibold text-sm px-5 py-2.5 transition-colors border border-doctor/20"
          >
            Stage
          </button>
        </div>

        {pendingDates.length > 0 && (
          <div>
            <p className="font-mono text-[10px] font-bold text-ink-soft uppercase tracking-widest mb-2">Staged — not yet saved</p>
            <div className="flex flex-wrap gap-2">
              {pendingDates.map(d => (
                <span key={d} className="flex items-center gap-1.5 bg-doctor-tint border border-doctor/20 text-doctor-dark font-mono text-[11px] font-semibold px-3 py-1.5 rounded-full">
                  {format(parseISO(d), 'dd MMM yyyy')}
                  <button onClick={() => setPending(p => p.filter(x => x !== d))} className="text-doctor-dark/70 hover:text-doctor-dark font-bold leading-none ml-0.5">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => addLeave(pendingDates)}
          disabled={pendingDates.length === 0 || adding}
          className="w-full rounded-xl bg-doctor hover:bg-doctor-dark disabled:opacity-50 text-white font-bold text-sm py-3 transition-all duration-150 hover:shadow-pop hover:-translate-y-0.5"
        >
          {adding ? 'Saving…' : `Save ${pendingDates.length > 0 ? `${pendingDates.length} ` : ''}Leave Day${pendingDates.length !== 1 ? 's' : ''}`}
        </button>
      </div>

      {/* Conflict warning */}
      {conflictInfo && (
        <div className="bg-danger-tint border border-danger/30 rounded-lg p-5">
          <div className="flex items-center gap-2 mb-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-danger" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg>
            <p className="text-sm font-bold text-[#7a2e29]">Appointments cancelled due to leave</p>
          </div>
          <ul className="space-y-1.5 mb-4">
            {conflictInfo.map(a => (
              <li key={a.id} className="flex items-center gap-2 text-xs text-[#7a2e29]">
                <span className="w-1.5 h-1.5 rounded-full bg-[#7a2e29] shrink-0" />
                {a.patientName} — <span className="font-mono">{format(parseISO(a.slotStart.substring(0, 10)), 'dd MMM yyyy')}</span>
              </li>
            ))}
          </ul>
          <button onClick={() => setConflictInfo(null)} className="text-xs font-semibold text-[#7a2e29] hover:underline">Dismiss</button>
        </div>
      )}
      </div>{/* end left column */}

      {/* Right column — Scheduled leave days */}
      <div className="bg-white rounded-lg border border-stone shadow-soft p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-stone mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-doctor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <h2 className="text-sm font-semibold text-ink">Scheduled Leave Days</h2>
          {leaveDays.length > 0 && (
            <span className="ml-auto font-mono text-[11px] font-bold bg-doctor-tint text-doctor-dark px-2.5 py-0.5 rounded-full">{leaveDays.length}</span>
          )}
        </div>
        {leaveDays.length === 0 ? (
          <div className="text-center py-8">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-stone-dark mx-auto mb-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 13l4 4L19 7" /></svg>
            <p className="text-sm text-ink-soft font-semibold">No leave days scheduled</p>
            <p className="text-xs text-stone-dark mt-1">You're available every day</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {leaveDays.map(d => (
              <li key={d} className="flex items-center justify-between bg-paper-dim rounded-md px-4 py-3 border border-stone">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-md bg-doctor-tint flex items-center justify-center text-doctor-dark font-mono text-sm font-bold">
                    {format(parseISO(d), 'dd')}
                  </div>
                  <span className="text-sm font-medium text-ink">{format(parseISO(d), 'MMMM yyyy (EEEE)')}</span>
                </div>
                <button
                  onClick={() => deleteLeave([d])} disabled={removing}
                  className="text-xs font-semibold text-[#7a2e29] bg-danger-tint hover:bg-danger/20 px-3 py-1.5 rounded-md transition-colors disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>{/* end right column */}

      </div>{/* end grid */}
    </div>
  );
}
