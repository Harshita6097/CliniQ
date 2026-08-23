import { Link } from 'react-router-dom';
import { slotLabel } from '../../utils/dateUtils';
import { StatusBadge } from '../common/index.jsx';

export default function AppointmentRow({ appt, viewHref, portal = 'patient' }) {
  const isPatientView = portal === 'patient';
  const name = isPatientView ? appt.doctorId?.name : appt.patientId?.name;
  const initial = name?.[0]?.toUpperCase() ?? '?';
  const TINT = { patient: 'bg-patient-tint text-patient-dark', doctor: 'bg-doctor-tint text-doctor-dark', admin: 'bg-admin-tint text-admin-dark' };

  return (
    <div className="flex items-center gap-3 px-5 py-3 hover:bg-paper-dim transition-colors group">
      <div className={`w-8 h-8 rounded-md flex items-center justify-center font-bold text-xs shrink-0 ${TINT[portal] ?? TINT.patient}`}>
        {initial}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-ink truncate">{isPatientView ? `Dr. ${name}` : name}</p>
        <p className="text-xs text-ink-soft font-mono">{slotLabel(appt.slotStart)}</p>
      </div>
      <StatusBadge status={appt.status} />
      {viewHref && (
        <Link
          to={viewHref}
          className="text-xs font-semibold text-ink-soft hover:text-ink opacity-0 group-hover:opacity-100 transition-opacity ml-1"
        >
          Open →
        </Link>
      )}
    </div>
  );
}
