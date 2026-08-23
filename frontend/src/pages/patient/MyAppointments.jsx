import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAppointments, useCancelAppointment } from '../../hooks/useAppointments';
import AppointmentCard from '../../components/appointments/AppointmentCard.jsx';
import CancelModal from '../../components/appointments/CancelModal.jsx';
import { SkeletonLoader, EmptyState } from '../../components/common/index.jsx';

const FILTERS = ['all', 'confirmed', 'completed', 'cancelled', 'held'];
const PAGE_SIZE = 10;

export default function MyAppointments() {
  const [filter, setFilter]     = useState('all');
  const [sort, setSort]         = useState('newest');
  const [cancelId, setCancelId] = useState(null);
  const [page, setPage]         = useState(1);

  const { data: appointments = [], isLoading } = useAppointments(filter === 'all' ? undefined : filter);
  const { mutate: cancel, isPending }          = useCancelAppointment();

  const sorted = [...appointments].sort((a, b) => {
    const diff = new Date(b.slotStart) - new Date(a.slotStart);
    return sort === 'newest' ? diff : -diff;
  });

  const totalPages = Math.max(1, Math.ceil(sorted.length / PAGE_SIZE));
  const paged = sorted.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleCancel = (reason) => {
    cancel({ id: cancelId, reason }, { onSuccess: () => setCancelId(null) });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">My Appointments</h1>
        <p className="text-sm text-ink-soft mt-1">Track and manage all your visits</p>
      </div>

      {/* Filters + sort */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-2 flex-wrap">
          {FILTERS.map(f => (
            <button
              key={f}
              onClick={() => { setFilter(f); setPage(1); }}
              className={`px-4 py-2 rounded-full font-mono text-[11px] font-semibold capitalize transition-all duration-150 ${
                filter === f
                  ? 'bg-patient text-white shadow-soft'
                  : 'bg-white border border-stone text-ink-soft hover:border-patient-dark hover:text-patient-dark'
              }`}
            >
              {f}
            </button>
          ))}
        </div>
        <select
          value={sort} onChange={e => setSort(e.target.value)}
          className="rounded-md border border-stone px-3 py-2 text-xs font-semibold text-ink-soft bg-white focus:outline-none focus:ring-2 focus:ring-patient"
        >
          <option value="newest">Newest first</option>
          <option value="oldest">Oldest first</option>
        </select>
      </div>

      {isLoading ? (
        <SkeletonLoader variant="card" count={3} />
      ) : sorted.length === 0 ? (
        <div className="bg-white rounded-lg border border-stone shadow-soft">
          <EmptyState
            icon={<svg viewBox="0 0 24 24" fill="none" className="w-10 h-10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>}
            heading="No appointments found"
            subtext="Try a different filter or book a new appointment"
            ctaLabel="Book now"
            ctaHref="/patient/book"
          />
        </div>
      ) : (
        <>
          <div className="space-y-3">
            {paged.map(appt => (
              <AppointmentCard
                key={appt._id}
                appt={appt}
                viewHref={`/patient/appointments/${appt._id}`}
                onCancel={setCancelId}
                portal="patient"
              />
            ))}
          </div>

          {totalPages > 1 && (
            <div className="flex items-center justify-between pt-2">
              <p className="font-mono text-[11px] text-ink-soft">
                {(page - 1) * PAGE_SIZE + 1}–{Math.min(page * PAGE_SIZE, sorted.length)} of {sorted.length}
              </p>
              <div className="flex gap-1">
                <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone text-ink-soft hover:bg-paper-dim disabled:opacity-40 transition-colors">←</button>
                <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages} className="px-3 py-1.5 text-xs font-semibold rounded-md border border-stone text-ink-soft hover:bg-paper-dim disabled:opacity-40 transition-colors">→</button>
              </div>
            </div>
          )}
        </>
      )}

      <CancelModal
        isOpen={!!cancelId}
        onClose={() => setCancelId(null)}
        onConfirm={handleCancel}
        isPending={isPending}
      />
    </div>
  );
}
