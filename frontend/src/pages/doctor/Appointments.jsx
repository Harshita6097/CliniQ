import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getDoctorAppointments } from '../../api/doctor.api';
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx';
import { SkeletonLoader, EmptyState } from '../../components/common/index.jsx';

const FILTERS = ['all', 'confirmed', 'completed', 'cancelled'];
const PAGE_SIZE = 10;

export default function DoctorAppointments() {
  const [filter, setFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage]     = useState(1);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['doctorAppointments', filter],
    queryFn: () => getDoctorAppointments(filter === 'all' ? undefined : filter),
  });

  const filtered = appointments.filter(a =>
    !search || a.patientId?.name?.toLowerCase().includes(search.toLowerCase())
  );

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Appointments</h1>
        <p className="text-sm text-ink-soft mt-1">All your patient appointments</p>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button key={f} onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-full font-mono text-[11px] font-semibold capitalize transition-all ${filter === f ? 'bg-doctor text-white shadow-soft' : 'bg-white border border-stone text-ink-soft hover:border-doctor hover:text-doctor'}`}
            >{f}</button>
          ))}
        </div>
        <div className="relative ml-auto">
          <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-stone-dark" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <input type="text" placeholder="Search patient…" value={search} onChange={e => { setSearch(e.target.value); setPage(1); }}
            className="rounded-md border border-stone pl-9 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-doctor bg-paper focus:bg-white text-ink w-48"
          />
        </div>
      </div>

      {isLoading ? <SkeletonLoader variant="card" count={4} /> : filtered.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone shadow-soft">
          <EmptyState
            icon={<svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
            heading="No appointments found"
            subtext="Try a different filter or search term"
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(appt => (
              <AppointmentCard key={appt._id} appt={appt} viewHref={`/doctor/appointments/${appt._id}`} portal="doctor" />
            ))}
          </div>
          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="font-mono text-[11px] text-ink-soft">{(page-1)*PAGE_SIZE+1}–{Math.min(page*PAGE_SIZE, filtered.length)} of {filtered.length}</p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p-1))} disabled={page===1} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone text-ink-soft hover:bg-paper-dim disabled:opacity-40 transition-colors">←</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p+1))} disabled={page===totalPages} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone text-ink-soft hover:bg-paper-dim disabled:opacity-40 transition-colors">→</button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
