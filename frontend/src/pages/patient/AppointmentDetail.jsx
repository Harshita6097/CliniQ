import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { getAppointmentById } from '../../api/appointment.api';
import { useCancelAppointment } from '../../hooks/useAppointments';
import { formatSlot } from '../../utils/dateUtils';
import { StatusBadge, SkeletonLoader } from '../../components/common/index.jsx';
import CancelModal from '../../components/appointments/CancelModal.jsx';
import StatusHistory from '../../components/appointments/StatusHistory.jsx';
import PrescriptionCard from '../../components/appointments/PrescriptionCard.jsx';
import AICard from '../../components/appointments/AICard.jsx';
import PulseThread from '../../components/common/PulseThread.jsx';

function Section({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
      <button
        onClick={() => setOpen(o => !o)}
        className="w-full flex items-center justify-between px-5 py-4 hover:bg-paper-dim transition-colors"
      >
        <div className="flex items-center gap-2">
          <span className="text-ink-soft">{icon}</span>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 text-stone-dark transition-transform ${open ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <path d="M6 9l6 6 6-6" />
        </svg>
      </button>
      {open && <div className="px-5 pb-5 border-t border-stone">{children}</div>}
    </div>
  );
}

function DocumentChecklist({ items }) {
  const [checked, setChecked] = useState({});
  const toggle = i => setChecked(c => ({ ...c, [i]: !c[i] }));
  return (
    <ul className="space-y-2 mt-3">
      {items.map((item, i) => (
        <li key={i} className="flex items-center gap-3 cursor-pointer" onClick={() => toggle(i)}>
          <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${checked[i] ? 'bg-ok border-ok' : 'border-stone-dark'}`}>
            {checked[i] && <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="white" strokeWidth="3" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>}
          </div>
          <span className={`text-sm transition-colors ${checked[i] ? 'line-through text-ink-soft' : 'text-ink'}`}>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export default function PatientAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCancel, setShowCancel] = useState(false);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['appointment', id],
    queryFn: () => getAppointmentById(id),
  });
  const { mutate: cancel, isPending } = useCancelAppointment();

  if (isLoading) return <div className="p-8"><SkeletonLoader variant="card" count={3} /></div>;
  if (isError) return (
    <div className="text-center py-20">
      <p className="text-sm text-danger font-medium">Appointment not found or you don't have access to it.</p>
      <button onClick={() => navigate('/patient/appointments')} className="mt-4 text-sm font-semibold text-patient hover:underline">← Back to appointments</button>
    </div>
  );

  const { appointment: appt, history } = data;
  const canCancel = appt.status === 'confirmed' || appt.status === 'held';
  const isCompleted = appt.status === 'completed';

  const handleCancel = reason => {
    cancel({ id, reason }, { onSuccess: () => navigate('/patient/appointments') });
  };

  return (
    <div className="max-w-4xl space-y-5 animate-fadeIn pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-patient hover:text-patient-dark font-semibold">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      {/* Header card */}
      <div className="relative rounded-lg bg-patient-dark p-6 text-white shadow-pop overflow-hidden">
        <PulseThread color="#ffffff" opacity={0.25} />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="font-mono text-[10px] text-white/60 uppercase tracking-widest mb-1">Appointment</p>
              <h1 className="font-display text-xl font-semibold">Dr. {appt.doctorId?.name}</h1>
              <p className="font-mono text-xs text-white/70 mt-1">{formatSlot(appt.slotStart)}</p>
            </div>
            <StatusBadge status={appt.status} />
          </div>
          <div className="flex gap-3 text-sm flex-wrap">
            <div className="bg-white/15 rounded-md px-3 py-2">
              <p className="font-mono text-[10px] text-white/60 uppercase">From</p>
              <p className="font-mono text-xs font-semibold">{formatSlot(appt.slotStart)}</p>
            </div>
            <div className="bg-white/15 rounded-md px-3 py-2">
              <p className="font-mono text-[10px] text-white/60 uppercase">To</p>
              <p className="font-mono text-xs font-semibold">{formatSlot(appt.slotEnd)}</p>
            </div>
          </div>
        </div>
      </div>

      {appt.cancellationReason && (
        <div className="bg-danger-tint border border-danger/30 rounded-md px-5 py-4 flex gap-3">
          <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5 text-[#7a2e29] shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 6L6 18M6 6l12 12" /></svg>
          <div>
            <p className="text-sm font-semibold text-[#7a2e29]">Cancellation Reason</p>
            <p className="text-sm text-[#7a2e29]/80 mt-0.5">{appt.cancellationReason}</p>
          </div>
        </div>
      )}

      {appt.symptomFormText && (
        <Section title="Your Symptoms" defaultOpen={!isCompleted && appt.status !== 'cancelled'}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        >
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed pt-4">{appt.symptomFormText}</p>
        </Section>
      )}

      {appt.preVisitSummary && (
        <Section title="Pre-visit AI Summary" defaultOpen={!isCompleted}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 100 20A10 10 0 0012 2zm0 6v4m0 4h.01" /></svg>}
        >
          <div className="pt-4">
            <AICard type="pre" summary={appt.preVisitSummary} portal="patient" />
            {appt.preVisitSummary.documentsToCarry?.length > 0 && (
              <DocumentChecklist items={appt.preVisitSummary.documentsToCarry} />
            )}
          </div>
        </Section>
      )}

      {appt.postVisitSummary && (
        <Section title="Post-visit Summary" defaultOpen={isCompleted}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" /></svg>}
        >
          <div className="pt-4"><AICard type="post" summary={appt.postVisitSummary} portal="patient" /></div>
        </Section>
      )}

      {appt.prescription?.length > 0 && (
        <Section title="Prescription" defaultOpen={isCompleted}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="5" /><path d="M7 12h10" /></svg>}
        >
          <div className="pt-4"><PrescriptionCard prescription={appt.prescription} /></div>
        </Section>
      )}

      {history?.length > 0 && (
        <Section title="Status History"
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
        >
          <div className="pt-4"><StatusHistory history={history} portal="patient" /></div>
        </Section>
      )}

      {/* Sticky cancel bar */}
      {canCancel && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-30 md:left-64">
          <div className="bg-white rounded-lg border border-stone shadow-pop px-5 py-3 flex items-center gap-4 max-w-sm w-full">
            <p className="text-xs text-ink-soft flex-1">Need to cancel this appointment?</p>
            <button
              onClick={() => setShowCancel(true)}
              className="text-xs font-bold text-[#7a2e29] bg-danger-tint hover:bg-danger/20 px-4 py-2 rounded-md transition-colors shrink-0"
            >
              Cancel appointment
            </button>
          </div>
        </div>
      )}

      <CancelModal isOpen={showCancel} onClose={() => setShowCancel(false)} onConfirm={handleCancel} isPending={isPending} />
    </div>
  );
}
