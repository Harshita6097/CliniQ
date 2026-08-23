import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { getDoctorAppointmentById, submitNotes } from '../../api/doctor.api';
import { SkeletonLoader } from '../../components/common/index.jsx';
import PatientCard from '../../components/doctor/PatientCard.jsx';
import NoteForm from '../../components/doctor/NoteForm.jsx';
import PrescriptionBuilder from '../../components/doctor/PrescriptionBuilder.jsx';
import PrescriptionCard from '../../components/appointments/PrescriptionCard.jsx';
import AICard from '../../components/appointments/AICard.jsx';
import StatusHistory from '../../components/appointments/StatusHistory.jsx';
import { Spinner } from '../../components/common/index.jsx';
import toast from 'react-hot-toast';

function Section({ title, icon, children, defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
      <button onClick={() => setOpen(o => !o)} className="w-full flex items-center justify-between px-5 py-4 hover:bg-paper-dim transition-colors">
        <div className="flex items-center gap-2">
          <span className="text-ink-soft">{icon}</span>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 text-stone-dark transition-transform ${open ? 'rotate-180' : ''}`} stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M6 9l6 6 6-6" /></svg>
      </button>
      {open && <div className="px-5 pb-5 border-t border-stone">{children}</div>}
    </div>
  );
}

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [notes, setNotes]               = useState('');
  const [prescription, setPrescription] = useState([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ['doctorAppointment', id],
    queryFn: () => getDoctorAppointmentById(id),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => submitNotes(id, { postVisitNotes: notes, prescription }),
    onSuccess: () => {
      toast.success('Notes submitted successfully.');
      queryClient.invalidateQueries({ queryKey: ['doctorAppointment', id] });
      queryClient.invalidateQueries({ queryKey: ['doctorAppointments'] });
    },
    onError: err => toast.error(err.response?.data?.message || 'Submission failed.'),
  });

  if (isLoading) return <div className="p-8"><SkeletonLoader variant="card" count={3} /></div>;
  if (isError) return (
    <div className="text-center py-20">
      <p className="text-sm text-danger font-medium">Appointment not found or you don't have access to it.</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-sm font-semibold text-doctor hover:underline">← Go back</button>
    </div>
  );

  const { appointment: appt, history } = data;
  const isConfirmed = appt.status === 'confirmed';

  const handleSubmit = e => {
    e.preventDefault();
    if (!notes.trim()) { toast.error('Post-visit notes are required.'); return; }
    if (notes.trim().length < 20) { toast.error('Notes must be at least 20 characters.'); return; }
    submit();
  };

  return (
    <div className="max-w-4xl space-y-5 animate-fadeIn pb-24">
      <button onClick={() => navigate(-1)} className="flex items-center gap-1 text-sm text-doctor hover:text-doctor-dark font-semibold">
        <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M15 19l-7-7 7-7" /></svg>
        Back
      </button>

      <PatientCard appt={appt} />

      {appt.symptomFormText && (
        <Section title="Patient's Symptoms" defaultOpen={true}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>}
        >
          <p className="text-sm text-ink whitespace-pre-wrap leading-relaxed pt-4">{appt.symptomFormText}</p>
        </Section>
      )}

      {appt.preVisitSummary && (
        <Section title="Pre-visit AI Summary" defaultOpen={isConfirmed}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>}
        >
          <div className="pt-4"><AICard type="pre" summary={appt.preVisitSummary} portal="doctor" /></div>
        </Section>
      )}

      {appt.postVisitSummary && (
        <Section title="Post-visit Summary" defaultOpen={true}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2m-6 9l2 2 4-4" /></svg>}
        >
          <div className="pt-4"><AICard type="post" summary={appt.postVisitSummary} portal="doctor" /></div>
        </Section>
      )}

      {!isConfirmed && appt.prescription?.length > 0 && (
        <Section title="Prescription" defaultOpen={true}
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="7" y="2" width="10" height="20" rx="5" /><path d="M7 12h10" /></svg>}
        >
          <div className="pt-4"><PrescriptionCard prescription={appt.prescription} /></div>
        </Section>
      )}

      {isConfirmed && (
        <form onSubmit={handleSubmit} className="bg-white rounded-lg border border-stone shadow-soft p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-stone">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-doctor" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z" /></svg>
            <h2 className="text-sm font-semibold text-ink">Submit Post-visit Notes</h2>
          </div>
          <NoteForm notes={notes} setNotes={setNotes} />
          <PrescriptionBuilder prescription={prescription} setPrescription={setPrescription} />
        </form>
      )}

      {history?.length > 0 && (
        <Section title="Status History"
          icon={<svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10" /><path d="M12 6v6l4 2" /></svg>}
        >
          <div className="pt-4"><StatusHistory history={history} portal="doctor" /></div>
        </Section>
      )}

      {/* Sticky submit bar */}
      {isConfirmed && (
        <div className="fixed bottom-4 left-0 right-0 flex justify-center px-4 z-30 md:left-64">
          <div className="bg-white rounded-lg border border-stone shadow-pop px-5 py-3 flex items-center gap-4 max-w-sm w-full">
            <p className="text-xs text-ink-soft flex-1">Ready to complete this visit?</p>
            <button
              onClick={handleSubmit}
              disabled={isPending || notes.trim().length < 20}
              className="flex items-center gap-2 text-xs font-bold bg-doctor hover:bg-doctor-dark disabled:opacity-50 text-white px-4 py-2 rounded-md transition-colors shrink-0"
            >
              {isPending ? <><Spinner className="w-3.5 h-3.5" /> Submitting…</> : 'Submit & Complete ✓'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
