import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { adminGetNotifications } from '../../api/admin.api';
import { timeAgo } from '../../utils/dateUtils';
import { SkeletonLoader } from '../../components/common/index.jsx';
import { DataTable } from '../../components/admin/index.jsx';

const TABS = [
  { label: 'All',    value: '' },
  { label: 'Queued', value: 'queued' },
  { label: 'Sent',   value: 'sent' },
  { label: 'Failed', value: 'failed' },
];

const TYPE_LABELS = { confirmation: 'Confirmation', reminder: 'Reminder', cancellation: 'Cancellation', medication_reminder: 'Medication' };
const TYPE_STYLE  = { confirmation: 'bg-patient-tint text-patient-dark', reminder: 'bg-doctor-tint text-doctor-dark', cancellation: 'bg-danger-tint text-danger', medication_reminder: 'bg-admin-tint text-admin-dark' };
const STATUS_STYLE = { sent: 'bg-ok-tint text-ok', failed: 'bg-danger-tint text-danger', queued: 'bg-warn-tint text-warn' };

export default function Notifications() {
  const [activeTab, setActiveTab]       = useState('');
  const [autoRefresh, setAutoRefresh]   = useState(false);
  const [expandedErr, setExpandedErr]   = useState(null);

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ['adminNotifs', activeTab],
    queryFn: () => adminGetNotifications(activeTab || undefined),
    staleTime: 0,
  });

  useEffect(() => {
    if (!autoRefresh) return;
    const t = setInterval(() => refetch(), 30000);
    return () => clearInterval(t);
  }, [autoRefresh, refetch]);

  const summary       = data?.summary       ?? { queued: 0, sent: 0, failed: 0 };
  const notifications = data?.notifications ?? [];

  const columns = [
    { key: 'recipient', label: 'Recipient', render: row => (
      <div><p className="font-semibold text-ink text-sm">{row.recipientId?.name ?? '—'}</p><p className="font-mono text-[11px] text-ink-soft">{row.recipientId?.email ?? ''}</p></div>
    )},
    { key: 'subject', label: 'Subject', render: row => (
      <div className="max-w-[200px]">
        <p className="text-sm text-ink truncate">{row.emailPayload?.subject ?? '—'}</p>
        {row.errorMessage && (
          <button onClick={() => setExpandedErr(expandedErr === row._id ? null : row._id)} className="text-[11px] text-danger hover:underline mt-0.5 text-left">
            {expandedErr === row._id ? 'Hide error ▲' : 'Show error ▼'}
          </button>
        )}
        {expandedErr === row._id && row.errorMessage && (
          <p className="font-mono text-[10px] text-danger bg-danger-tint rounded p-1.5 mt-1 break-all">{row.errorMessage}</p>
        )}
      </div>
    )},
    { key: 'type', label: 'Type', render: row => (
      <span className={`font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${TYPE_STYLE[row.type] ?? 'bg-paper-dim text-ink-soft'}`}>{TYPE_LABELS[row.type] ?? row.type}</span>
    )},
    { key: 'status', label: 'Status', render: row => (
      <span className={`font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${STATUS_STYLE[row.status] ?? 'bg-paper-dim text-ink-soft'}`}>{row.status}</span>
    )},
    { key: 'retries', label: 'Retries', render: row => <span className="font-mono text-xs text-ink-soft">{row.retryCount ?? 0}</span> },
    { key: 'when', label: 'When', render: row => <span className="font-mono text-[11px] text-ink-soft whitespace-nowrap">{timeAgo(row.createdAt)}</span> },
  ];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="font-display text-2xl font-semibold text-ink">Notifications</h1>
          <p className="text-sm text-ink-soft mt-1">Email delivery status and retry queue</p>
        </div>
        <div className="flex items-center gap-3">
          <label className="flex items-center gap-2 text-xs font-semibold text-ink-soft cursor-pointer">
            <div
              onClick={() => setAutoRefresh(v => !v)}
              className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors cursor-pointer ${autoRefresh ? 'bg-admin' : 'bg-stone-dark'}`}
            >
              <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition-transform ${autoRefresh ? 'translate-x-4' : 'translate-x-0.5'}`} />
            </div>
            Auto-refresh (30s)
          </label>
          <button onClick={() => refetch()} disabled={isRefetching} className="flex items-center gap-2 text-sm font-semibold text-admin bg-admin-tint hover:bg-admin-tint2 border border-admin/20 px-4 py-2 rounded-md transition-colors disabled:opacity-50">
            <svg className={`w-4 h-4 ${isRefetching ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: 'Queued', value: summary.queued, tint: 'bg-warn-tint',   text: 'text-warn' },
          { label: 'Sent',   value: summary.sent,   tint: 'bg-ok-tint',     text: 'text-ok' },
          { label: 'Failed', value: summary.failed, tint: 'bg-danger-tint', text: 'text-danger' },
        ].map(({ label, value, tint, text }) => (
          <div key={label} className={`rounded-lg p-5 ${tint} flex items-center gap-4 border border-stone/50`}>
            <div>
              <p className={`font-mono text-2xl font-bold ${text}`}>{value}</p>
              <p className={`text-xs font-semibold ${text} opacity-80`}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
        <div className="flex border-b border-stone">
          {TABS.map(tab => (
            <button key={tab.value} onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 ${activeTab === tab.value ? 'text-admin border-admin bg-admin-tint/30' : 'text-ink-soft border-transparent hover:text-ink hover:bg-paper-dim'}`}
            >{tab.label}</button>
          ))}
        </div>
        {isLoading ? <div className="p-6"><SkeletonLoader variant="row" count={5} /></div> : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <svg viewBox="0 0 24 24" fill="none" className="w-10 h-10 text-stone-dark mx-auto mb-3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
            <p className="text-sm text-ink-soft font-semibold">No notifications found</p>
          </div>
        ) : (
          <DataTable columns={columns} rows={notifications} pageSize={10} mobileCardView={true} />
        )}
      </div>
    </div>
  );
}
