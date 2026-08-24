import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminGetAllAppointments } from '../../api/admin.api';
import { formatSlot, formatDate } from '../../utils/dateUtils';
import { StatusBadge, SkeletonLoader } from '../../components/common/index.jsx';
import { DataTable } from '../../components/admin/index.jsx';

const STATUSES = ['', 'confirmed', 'completed', 'cancelled', 'held'];

function exportCSV(appointments) {
  const headers = ['Patient', 'Patient Email', 'Doctor', 'Doctor Email', 'Slot', 'Status', 'Booked On'];
  const rows = appointments.map(a => [
    a.patientId?.name ?? '', a.patientId?.email ?? '',
    `Dr. ${a.doctorId?.name ?? ''}`, a.doctorId?.email ?? '',
    formatSlot(a.slotStart), a.status, formatDate(a.createdAt),
  ]);
  const csv = [headers, ...rows].map(r => r.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a'); a.href = url; a.download = 'appointments.csv'; a.click();
  URL.revokeObjectURL(url);
}

export default function AllAppointments() {
  const navigate = useNavigate();
  const [filters, setFilters] = useState({ status: '', doctorName: '', patientName: '', from: '', to: '' });
  const [applied, setApplied] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ['adminAllAppts', applied],
    queryFn: () => {
      const params = {};
      if (applied.status) params.status = applied.status;
      if (applied.from)   params.from   = applied.from;
      if (applied.to)     params.to     = applied.to;
      return adminGetAllAppointments(params);
    },
  });

  const allAppointments = data?.appointments ?? [];
  const appointments = allAppointments.filter(appt => {
    const dn = applied.doctorName?.toLowerCase() ?? '';
    const pn = applied.patientName?.toLowerCase() ?? '';
    if (dn && !appt.doctorId?.name?.toLowerCase().includes(dn)) return false;
    if (pn && !appt.patientId?.name?.toLowerCase().includes(pn)) return false;
    return true;
  });

  const handleApply = e => { e.preventDefault(); setApplied({ ...filters }); };
  const handleReset = () => { const empty = { status: '', doctorName: '', patientName: '', from: '', to: '' }; setFilters(empty); setApplied({}); };

  const inputCls = 'w-full rounded-md border border-stone px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-admin bg-paper focus:bg-white text-ink transition-colors';

  const columns = [
    { key: 'patient', label: 'Patient', render: row => (
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-md bg-admin-tint flex items-center justify-center text-admin-dark font-bold text-xs shrink-0">{row.patientId?.name?.[0] ?? 'P'}</div>
        <div><p className="font-semibold text-ink text-sm">{row.patientId?.name}</p><p className="font-mono text-[11px] text-ink-soft">{row.patientId?.email}</p></div>
      </div>
    )},
    { key: 'doctor', label: 'Doctor', render: row => (
      <div><p className="font-semibold text-ink text-sm">{row.doctorId?.name}</p><p className="font-mono text-[11px] text-ink-soft">{row.doctorId?.email}</p></div>
    )},
    { key: 'slot', label: 'Slot', render: row => <span className="font-mono text-xs text-ink">{formatSlot(row.slotStart)}</span> },
    { key: 'status', label: 'Status', render: row => <StatusBadge status={row.status} /> },
    { key: 'bookedOn', label: 'Booked On', render: row => <span className="font-mono text-[11px] text-ink-soft">{formatDate(row.createdAt)}</span> },
  ];

  const tableRows = appointments.map(a => ({ ...a, _onClick: () => navigate(`/admin/appointments/${a._id}`) }));

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">All Appointments</h1>
          <p className="text-sm text-ink-soft mt-1">System-wide appointment records with filters</p>
        </div>
        {appointments.length > 0 && (
          <button onClick={() => exportCSV(appointments)} className="flex items-center gap-2 text-sm font-semibold text-admin bg-admin-tint hover:bg-admin-tint2 border border-admin/20 px-4 py-2 rounded-md transition-colors">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3" /></svg>
            Export CSV
          </button>
        )}
      </div>

      {/* Filters */}
      <form onSubmit={handleApply} className="bg-white rounded-lg border border-stone shadow-soft p-6">
        <div className="flex items-center gap-2 mb-4">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-admin" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8" /><path d="M21 21l-4.35-4.35" /></svg>
          <h2 className="text-sm font-semibold text-ink">Filter Appointments</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Status</label>
            <select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} className={inputCls}>
              {STATUSES.map(s => <option key={s} value={s}>{s || 'All statuses'}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Doctor name</label>
            <input type="text" value={filters.doctorName} placeholder="Search doctor…" onChange={e => setFilters(f => ({ ...f, doctorName: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">Patient name</label>
            <input type="text" value={filters.patientName} placeholder="Search patient…" onChange={e => setFilters(f => ({ ...f, patientName: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">From date</label>
            <input type="date" value={filters.from} onChange={e => setFilters(f => ({ ...f, from: e.target.value }))} className={inputCls} />
          </div>
          <div>
            <label className="block text-xs font-semibold text-ink-soft mb-1">To date</label>
            <input type="date" value={filters.to} onChange={e => setFilters(f => ({ ...f, to: e.target.value }))} className={inputCls} />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit" className="rounded-xl bg-admin hover:bg-admin-dark text-white text-sm font-bold px-5 py-2.5 transition-all hover:shadow-pop hover:-translate-y-0.5">Apply Filters</button>
          <button type="button" onClick={handleReset} className="rounded-xl border border-stone hover:bg-paper-dim text-ink-soft text-sm font-semibold px-5 py-2.5 transition-colors">Reset</button>
        </div>
      </form>

      {/* Results */}
      <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
        <div className="px-6 py-5 border-b border-stone bg-paper-dim flex items-center justify-between">
          <h2 className="font-display text-base font-semibold text-ink">Results</h2>
          {!isLoading && <span className="font-mono text-[11px] font-bold bg-admin-tint text-admin-dark px-3 py-1 rounded-full">{appointments.length} appointment{appointments.length !== 1 ? 's' : ''}</span>}
        </div>
        {isLoading ? <div className="p-6"><SkeletonLoader variant="row" count={5} /></div> : appointments.length === 0 ? (
          <div className="py-16 text-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-stone-dark mx-auto mb-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            <p className="text-sm text-ink-soft font-semibold">No appointments match the selected filters</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={tableRows} pageSize={10} mobileCardView={true} />
        )}
      </div>
    </div>
  );
}
