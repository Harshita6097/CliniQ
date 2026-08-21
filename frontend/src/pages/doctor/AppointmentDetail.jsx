import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDoctorAppointmentById, submitNotes } from "../../api/doctor.api";
import { formatSlot, timeAgo } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";
import toast from "react-hot-toast";

const FREQUENCIES = [
  "Once daily", "Twice daily", "Three times daily",
  "Four times daily", "Every 8 hours", "Every 12 hours", "Weekly", "As needed",
];

const emptyItem = () => ({ medicine: "", dosage: "", frequency: "Once daily", durationDays: 1, notes: "" });

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes]           = useState("");
  const [prescription, setPrescription] = useState([]);

  const { data, isLoading, isError } = useQuery({
    queryKey: ["doctorAppointment", id],
    queryFn:  () => getDoctorAppointmentById(id),
  });

  const { mutate: submit, isPending } = useMutation({
    mutationFn: () => submitNotes(id, { postVisitNotes: notes, prescription }),
    onSuccess: () => {
      toast.success("Notes submitted successfully.");
      queryClient.invalidateQueries({ queryKey: ["doctorAppointment", id] });
      queryClient.invalidateQueries({ queryKey: ["doctorAppointments"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Submission failed."),
  });

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (isError)   return <p className="text-sm text-red-500">Failed to load appointment.</p>;

  const { appointment: appt, history } = data;
  const isConfirmed = appt.status === "confirmed";

  const addItem    = () => setPrescription((p) => [...p, emptyItem()]);
  const removeItem = (i) => setPrescription((p) => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) =>
    setPrescription((p) => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) { toast.error("Post-visit notes are required."); return; }
    submit();
  };

  return (
    <div className="max-w-2xl">
      <button onClick={() => navigate(-1)} className="text-sm text-green-600 hover:underline mb-5 block">
        ← Back
      </button>

      <div className="flex items-start justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Appointment Detail</h1>
          <p className="text-sm text-gray-500 mt-1">{formatSlot(appt.slotStart)}</p>
        </div>
        <span className={`text-xs font-medium px-3 py-1.5 rounded-full ${statusClasses(appt.status)}`}>
          {statusLabel(appt.status)}
        </span>
      </div>

      {/* Patient info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-2">
        <Row label="Patient"  value={appt.patientId?.name} />
        <Row label="Email"    value={appt.patientId?.email} />
        {appt.patientId?.phone && <Row label="Phone" value={appt.patientId.phone} />}
        <Row label="Slot"     value={`${formatSlot(appt.slotStart)} → ${formatSlot(appt.slotEnd)}`} />
      </div>

      {/* Symptom form */}
      {appt.symptomFormText && (
        <Section title="Patient's Symptoms">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{appt.symptomFormText}</p>
        </Section>
      )}

      {/* Pre-visit AI summary */}
      {appt.preVisitSummary && (
        <Section title="Pre-visit AI Summary" fallback={appt.preVisitSummary.isFallback}>
          {appt.preVisitSummary.urgency && (
            <p className="text-sm mb-1">
              <span className="font-medium">Urgency:</span>{" "}
              <span className={
                appt.preVisitSummary.urgency === "High" ? "text-red-600 font-semibold" :
                appt.preVisitSummary.urgency === "Medium" ? "text-yellow-600 font-semibold" :
                "text-green-600 font-semibold"
              }>
                {appt.preVisitSummary.urgency}
              </span>
            </p>
          )}
          <p className="text-sm mb-2">
            <span className="font-medium">Chief complaint:</span> {appt.preVisitSummary.chiefComplaint}
          </p>
          {appt.preVisitSummary.suggestedQuestions?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Suggested questions:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                {appt.preVisitSummary.suggestedQuestions.map((q, i) => <li key={i}>{q}</li>)}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Post-visit summary (read-only after completion) */}
      {appt.postVisitSummary && (
        <Section title="Post-visit Summary" fallback={appt.postVisitSummary.isFallback}>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {appt.postVisitSummary.patientFriendlySummary}
          </p>
        </Section>
      )}

      {/* Prescription (read-only after completion) */}
      {!isConfirmed && appt.prescription?.length > 0 && (
        <Section title="Prescription">
          <div className="space-y-2">
            {appt.prescription.map((item, i) => (
              <div key={i} className="text-sm border border-gray-100 rounded-lg px-4 py-3 bg-gray-50">
                <p className="font-medium text-gray-800">{item.medicine} — {item.dosage}</p>
                <p className="text-gray-500">{item.frequency} · {item.durationDays} day(s)</p>
                {item.notes && <p className="text-gray-400 text-xs mt-0.5">{item.notes}</p>}
              </div>
            ))}
          </div>
        </Section>
      )}

      {/* Notes submission form — only for confirmed appointments */}
      {isConfirmed && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
          <h2 className="text-sm font-semibold text-gray-700 mb-4">Submit Post-visit Notes</h2>

          <div className="mb-4">
            <label className="block text-sm font-medium text-gray-700 mb-1">Clinical Notes *</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              required
              rows={4}
              placeholder="Diagnosis, observations, follow-up instructions…"
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 resize-none"
            />
          </div>

          {/* Prescription builder */}
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium text-gray-700">Prescription</label>
              <button
                type="button"
                onClick={addItem}
                className="text-xs text-green-600 hover:underline font-medium"
              >
                + Add medicine
              </button>
            </div>

            {prescription.length === 0 && (
              <p className="text-xs text-gray-400">No medicines added yet.</p>
            )}

            <div className="space-y-3">
              {prescription.map((item, i) => (
                <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 space-y-2">
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Medicine *</label>
                      <input
                        value={item.medicine}
                        onChange={(e) => updateItem(i, "medicine", e.target.value)}
                        required
                        placeholder="e.g. Paracetamol"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Dosage *</label>
                      <input
                        value={item.dosage}
                        onChange={(e) => updateItem(i, "dosage", e.target.value)}
                        required
                        placeholder="e.g. 500mg"
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Frequency *</label>
                      <select
                        value={item.frequency}
                        onChange={(e) => updateItem(i, "frequency", e.target.value)}
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      >
                        {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs text-gray-500 mb-0.5 block">Duration (days) *</label>
                      <input
                        type="number"
                        min={1}
                        value={item.durationDays}
                        onChange={(e) => updateItem(i, "durationDays", Number(e.target.value))}
                        required
                        className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs text-gray-500 mb-0.5 block">Notes (optional)</label>
                    <input
                      value={item.notes}
                      onChange={(e) => updateItem(i, "notes", e.target.value)}
                      placeholder="e.g. Take after meals"
                      className="w-full rounded-lg border border-gray-300 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-green-500"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white text-sm font-medium px-6 py-2 transition-colors"
          >
            {isPending ? "Submitting…" : "Submit Notes & Complete"}
          </button>
        </form>
      )}

      {/* Status history */}
      {history?.length > 0 && (
        <Section title="Status History">
          <ul className="space-y-2">
            {history.map((h) => (
              <li key={h._id} className="text-xs text-gray-500 flex gap-2">
                <span className="text-gray-300">•</span>
                <span>
                  <span className="font-medium text-gray-700">{h.fromStatus ?? "—"} → {h.toStatus}</span>
                  {h.reason && ` · ${h.reason}`}
                  <span className="ml-1 text-gray-400">({timeAgo(h.timestamp ?? h.createdAt)})</span>
                </span>
              </li>
            ))}
          </ul>
        </Section>
      )}
    </div>
  );
}

const Row = ({ label, value }) => (
  <div className="flex gap-2 text-sm">
    <span className="text-gray-500 w-20 shrink-0">{label}</span>
    <span className="text-gray-800">{value}</span>
  </div>
);

const Section = ({ title, children, fallback }) => (
  <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4">
    <div className="flex items-center gap-2 mb-3">
      <h2 className="text-sm font-semibold text-gray-700">{title}</h2>
      {fallback && (
        <span className="text-xs bg-yellow-100 text-yellow-700 px-2 py-0.5 rounded-full">AI unavailable</span>
      )}
    </div>
    {children}
  </div>
);
