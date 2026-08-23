import { formatSlot } from '../../utils/dateUtils';
import { StatusBadge } from '../common/index.jsx';
import PulseThread from '../common/PulseThread.jsx';

export default function PatientCard({ appt }) {
  const initial = appt.patientId?.name?.[0]?.toUpperCase() ?? 'P';
  return (
    <div className="relative rounded-lg bg-doctor-dark overflow-hidden shadow-pop text-white p-6">
      <PulseThread color="#ffffff" opacity={0.25} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-1">Patient Visit</p>
            <h1 className="font-display text-xl font-semibold">{appt.patientId?.name}</h1>
            <p className="font-mono text-xs text-white/70 mt-1">{formatSlot(appt.slotStart)}</p>
          </div>
          <StatusBadge status={appt.status} />
        </div>
        <div className="flex flex-wrap gap-3 text-sm">
          {appt.patientId?.email && (
            <div className="bg-white/15 rounded-md px-3 py-2">
              <p className="font-mono text-[10px] text-white/60 uppercase">Email</p>
              <p className="font-medium text-sm">{appt.patientId.email}</p>
            </div>
          )}
          {appt.patientId?.phone && (
            <div className="bg-white/15 rounded-md px-3 py-2">
              <p className="font-mono text-[10px] text-white/60 uppercase">Phone</p>
              <p className="font-medium">{appt.patientId.phone}</p>
            </div>
          )}
          <div className="bg-white/15 rounded-md px-3 py-2">
            <p className="font-mono text-[10px] text-white/60 uppercase">Slot</p>
            <p className="font-medium font-mono text-xs">{formatSlot(appt.slotStart)} → {formatSlot(appt.slotEnd)}</p>
          </div>
        </div>
      </div>
    </div>
  );
}
