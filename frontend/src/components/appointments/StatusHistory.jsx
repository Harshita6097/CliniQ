import { timeAgo } from '../../utils/dateUtils';

const PORTAL_DOT = { patient: 'border-patient', doctor: 'border-doctor', admin: 'border-admin' };

export default function StatusHistory({ history, portal = 'patient' }) {
  if (!history?.length) return null;
  const dotBorder = PORTAL_DOT[portal] ?? 'border-patient';

  return (
    <div className="relative pl-6">
      <div className="absolute left-2 top-0 bottom-0 w-px bg-stone-dark" />
      <ul className="space-y-5">
        {history.map((h, i) => (
          <li key={h._id ?? i} className="relative">
            <div className={`absolute -left-4 top-1 w-2.5 h-2.5 rounded-full bg-white border-2 ${dotBorder}`} />
            <p className="text-xs font-semibold text-ink">
              {h.fromStatus ?? '—'} → {h.toStatus}
            </p>
            {h.reason && <p className="text-xs text-ink-soft mt-0.5">{h.reason}</p>}
            <p className="font-mono text-[11px] text-stone-dark mt-0.5">{timeAgo(h.timestamp ?? h.createdAt)}</p>
          </li>
        ))}
      </ul>
    </div>
  );
}
