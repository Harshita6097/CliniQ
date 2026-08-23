import { timeAgo } from '../../utils/dateUtils';

const PORTAL_COLORS = {
  patient: { dot: 'bg-patient', line: 'bg-patient/30', badge: 'bg-patient-tint text-patient-dark' },
  doctor:  { dot: 'bg-doctor',  line: 'bg-doctor/30',  badge: 'bg-doctor-tint  text-doctor-dark'  },
  admin:   { dot: 'bg-admin',   line: 'bg-admin/30',   badge: 'bg-admin-tint   text-admin-dark'   },
};

const STATUS_ICON = {
  held:      <path d="M12 6v6l4 2" />,
  confirmed: <path d="M5 13l4 4L19 7" />,
  cancelled: <path d="M18 6L6 18M6 6l12 12" />,
  completed: <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
};

export default function StatusHistory({ history, portal = 'patient' }) {
  if (!history?.length) return null;
  const { dot, line, badge } = PORTAL_COLORS[portal] ?? PORTAL_COLORS.patient;

  return (
    <ul className="space-y-0">
      {history.map((h, i) => (
        <li key={h._id ?? i} className="flex gap-4">
          {/* Spine */}
          <div className="flex flex-col items-center">
            <div className={`w-8 h-8 rounded-full ${dot} flex items-center justify-center shrink-0 shadow-soft`}>
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="white" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                {STATUS_ICON[h.toStatus] ?? <circle cx="12" cy="12" r="4" />}
              </svg>
            </div>
            {i < history.length - 1 && <div className={`w-px flex-1 my-1 ${line}`} style={{ minHeight: '1.5rem' }} />}
          </div>
          {/* Content */}
          <div className="pb-5 pt-1 min-w-0">
            <div className="flex flex-wrap items-center gap-2 mb-0.5">
              {h.fromStatus && (
                <span className="font-mono text-[10px] font-semibold text-ink-soft bg-paper-dim px-2 py-0.5 rounded-full capitalize">{h.fromStatus}</span>
              )}
              {h.fromStatus && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3 text-stone-dark shrink-0" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M9 5l7 7-7 7" /></svg>}
              <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full capitalize ${badge}`}>{h.toStatus}</span>
            </div>
            {h.reason && <p className="text-xs text-ink-soft leading-relaxed">{h.reason}</p>}
            <p className="font-mono text-[11px] text-stone-dark mt-1">{timeAgo(h.timestamp ?? h.createdAt)}</p>
          </div>
        </li>
      ))}
    </ul>
  );
}
