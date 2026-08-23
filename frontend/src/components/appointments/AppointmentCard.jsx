import { Link } from 'react-router-dom';
import { slotLabel } from '../../utils/dateUtils';
import { StatusBadge } from '../common/index.jsx';
import { useEffect, useState } from 'react';

function HoldCountdown({ holdExpiresAt }) {
  const [secs, setSecs] = useState(() => Math.max(0, Math.floor((new Date(holdExpiresAt) - Date.now()) / 1000)));
  useEffect(() => {
    if (secs <= 0) return;
    const t = setInterval(() => setSecs(s => Math.max(0, s - 1)), 1000);
    return () => clearInterval(t);
  }, []);
  if (secs <= 0) return <span className="font-mono text-[11px] text-danger">Expired</span>;
  const m = Math.floor(secs / 60), s = secs % 60;
  const urgent = secs < 60;
  return (
    <span className={`font-mono text-[11px] font-semibold ${urgent ? 'text-danger animate-pulse2' : 'text-warn'}`}>
      {m}:{String(s).padStart(2, '0')} left
    </span>
  );
}

export default function AppointmentCard({ appt, viewHref, onCancel, portal = 'patient' }) {
  const isPatientView = portal === 'patient';
  const name = isPatientView ? appt.doctorId?.name : appt.patientId?.name;
  const sub  = isPatientView ? (appt.doctorId?.email ?? '') : (appt.patientId?.email ?? '');
  const initial = name?.[0]?.toUpperCase() ?? '?';

  const TINT = { patient: 'bg-patient-tint text-patient-dark', doctor: 'bg-doctor-tint text-doctor-dark', admin: 'bg-admin-tint text-admin-dark' };
  const tint = TINT[portal] ?? TINT.patient;

  return (
    <div className="bg-white rounded-lg border border-stone shadow-soft px-5 py-4 flex items-center justify-between gap-4 hover:shadow-pop hover:-translate-y-0.5 transition-all duration-200 group">
      <div className="flex items-center gap-4 min-w-0">
        <div className={`w-11 h-11 rounded-md flex items-center justify-center font-display font-bold text-base shrink-0 ${tint}`}>
          {initial}
        </div>
        <div className="min-w-0">
          <p className="text-sm font-semibold text-ink truncate">{isPatientView ? `Dr. ${name}` : name}</p>
          {sub && <p className="text-xs text-ink-soft truncate mt-0.5">{sub}</p>}
          <p className="text-xs text-ink-soft mt-0.5 font-mono">{slotLabel(appt.slotStart)}</p>
          {appt.status === 'held' && appt.holdExpiresAt && (
            <HoldCountdown holdExpiresAt={appt.holdExpiresAt} />
          )}
        </div>
      </div>
      <div className="flex items-center gap-2 shrink-0">
        <StatusBadge status={appt.status} />
        {viewHref && (
          <Link
            to={viewHref}
            className={`text-xs font-semibold px-3 py-1.5 rounded-md transition-colors ${
              portal === 'patient' ? 'text-patient bg-patient-tint hover:bg-patient-tint2'
              : portal === 'doctor' ? 'text-doctor bg-doctor-tint hover:bg-doctor-tint2'
              : 'text-admin bg-admin-tint hover:bg-admin-tint2'
            }`}
          >
            View
          </Link>
        )}
        {onCancel && (appt.status === 'confirmed' || appt.status === 'held') && (
          <button
            onClick={() => onCancel(appt._id)}
            className="text-xs font-semibold text-danger bg-danger-tint hover:bg-danger/20 px-3 py-1.5 rounded-md transition-colors"
          >
            Cancel
          </button>
        )}
      </div>
    </div>
  );
}
