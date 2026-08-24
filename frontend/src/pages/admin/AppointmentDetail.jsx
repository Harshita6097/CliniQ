import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { adminGetAppointmentById } from '../../api/admin.api';
import { formatSlot } from '../../utils/dateUtils';
import { StatusBadge, SkeletonLoader } from '../../components/common/index.jsx';
import PrescriptionCard from '../../components/appointments/PrescriptionCard.jsx';
import AICard from '../../components/appointments/AICard.jsx';
import StatusHistory from '../../components/appointments/StatusHistory.jsx';
import PulseThread from '../../components/common/PulseThread.jsx';

export default function AdminAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const { data, isLoading, isError } = useQuery({
    queryKey: ['adminAppointment', id],
    queryFn: () => adminGetAppointmentById(id),
  });

  const appt = data?.appointment;
  const history = data?.history ?? [];

  if (isLoading) return <div className="p-8"><SkeletonLoader variant="card" count={3} /></div>;
  if (isError || !appt) return (
    <div className="text-center py-20">
      <p className="text-sm text-danger font-medium">Appointment not found.</p>
      <button onClick={() => navigate('/admin/appointments')} className="mt-4 text-sm font-semibold text-admin hover:underline">← Back to appointments</button>
    </div>
  );

  return (
    <div className="max-w-4xl space-y-5 animate-fadeIn">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-admin hover:text-admin-dark font-semibold">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      <div className="relative rounded-lg bg-admin-dark p-6 text-white shadow-pop overflow-hidden">
        <PulseThread color="#ffffff" opacity={0.25} />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-1">Appointment — Admin View</p>
              <h1 className="font-display text-xl font-semibold">{appt.patientId?.name} → {appt.doctorId?.name}</h1>
              <p className="font-mono text-xs text-white/70 mt-1">{formatSlot(appt.slotStart)}</p>
            </div>
            <StatusBadge status={appt.status} />
          </div>
          <div className="flex flex-wrap gap-3">
            {appt.patientId?.email && <div className="bg-white/15 rounded-md px-3 py-2"><p className="font-mono text-[10px] text-white/60 uppercase">Patient</p><p className="text-sm font-medium">{appt.patientId.email}</p></div>}
            {appt.doctorId?.email && <div className="bg-white/15 rounded-md px-3 py-2"><p className="font-mono text-[10px] text-white/60 uppercase">Doctor</p><p className="text-sm font-medium">{appt.doctorId.email}</p></div>}
          </div>
        </div>
      </div>

      {appt.cancellationReason && (
        <div className="bg-danger-tint border border-danger/30 rounded-md px-5 py-4 flex gap-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#7a2e29] shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          <div><p className="text-sm font-semibold text-[#7a2e29]">Cancellation Reason</p><p className="text-sm text-[#7a2e29]/80 mt-0.5">{appt.cancellationReason}</p></div>
        </div>
      )}

      {appt.symptomFormText && (
        <div className="bg-white rounded-lg border border-stone shadow-soft p-5">
          <p className="font-mono text-[10px] font-bold text-ink-soft uppercase tracking-widest mb-3">Patient Symptoms</p>
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed">{appt.symptomFormText}</p>
        </div>
      )}

      {appt.preVisitSummary && <AICard type="pre" summary={appt.preVisitSummary} portal="admin" />}
      {appt.postVisitSummary && <AICard type="post" summary={appt.postVisitSummary} portal="admin" />}
      {appt.prescription?.length > 0 && <PrescriptionCard prescription={appt.prescription} />}
      {history.length > 0 && <StatusHistory history={history} portal="admin" />}
    </div>
  );
}
