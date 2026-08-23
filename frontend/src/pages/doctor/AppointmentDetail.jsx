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

const urgencyColors = {
  High:   "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low:    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

export default function DoctorAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const [notes, setNotes]               = useState("");
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

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (isError) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">⚠️</div>
      <p className="text-sm text-red-500 font-medium">Appointment not found or you don't have access to it.</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-sm font-medium text-indigo-600 hover:underline">
        ← Go back
      </button>
    </div>
  );

  const { appointment: appt, history } = data;
  const isConfirmed = appt.status === "confirmed";

  const addItem    = () => setPrescription(p => [...p, emptyItem()]);
  const removeItem = (i) => setPrescription(p => p.filter((_, idx) => idx !== i));
  const updateItem = (i, field, value) =>
    setPrescription(p => p.map((item, idx) => idx === i ? { ...item, [field]: value } : item));

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!notes.trim()) { toast.error("Post-visit notes are required."); return; }
    if (notes.trim().length < 20) { toast.error("Notes must be at least 20 characters."); return; }
    submit();
  };

  return (
    <div className="max-w-2xl space-y-5 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-indigo-600 hover:text-indigo-700 font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-6 text-white shadow-xl shadow-indigo-200 overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-indigo-200 text-xs font-medium mb-1">Patient Visit</p>
              <h1 className="text-xl font-bold">{appt.patientId?.name}</h1>
              <p className="text-indigo-200 text-sm mt-1">{formatSlot(appt.slotStart)}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusClasses(appt.status)}`}>
              {statusLabel(appt.status)}
            </span>
          </div>
          <div className="flex flex-wrap gap-3 text-sm">
            {appt.patientId?.email && (
              <div className="bg-white/20 rounded-xl px-3 py-2">
                <p className="text-indigo-200 text-xs">Email</p>
                <p className="font-medium text-sm">{appt.patientId.email}</p>
              </div>
            )}
            {appt.patientId?.phone && (
              <div className="bg-white/20 rounded-xl px-3 py-2">
                <p className="text-indigo-200 text-xs">Phone</p>
                <p className="font-medium">{appt.patientId.phone}</p>
              </div>
            )}
            <div className="bg-white/20 rounded-xl px-3 py-2">
              <p className="text-indigo-200 text-xs">Slot</p>
              <p className="font-medium">{formatSlot(appt.slotStart)} → {formatSlot(appt.slotEnd)}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Symptoms */}
      {appt.symptomFormText && (
        <Card title="Patient's Symptoms" icon="🩺">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{appt.symptomFormText}</p>
        </Card>
      )}

      {/* Pre-visit AI summary */}
      {appt.preVisitSummary && (
        <Card title="Pre-visit AI Summary" icon="🤖" fallback={appt.preVisitSummary.isFallback}>
          {appt.preVisitSummary.urgency && urgencyColors[appt.preVisitSummary.urgency] && (
            <div className="mb-3">
              <span className={`inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-full border ${urgencyColors[appt.preVisitSummary.urgency] ?? "bg-gray-100 text-gray-600"}`}>
                ⚡ Urgency: {appt.preVisitSummary.urgency}
              </span>
            </div>
          )}
          <p className="text-sm text-gray-700 mb-3">
            <span className="font-semibold text-gray-800">Chief complaint: </span>
            {appt.preVisitSummary.chiefComplaint}
          </p>
          {appt.preVisitSummary.suggestedQuestions?.length > 0 && (
            <div className="bg-indigo-50 rounded-xl p-4">
              <p className="text-xs font-bold text-indigo-700 uppercase tracking-wide mb-2">💬 Suggested questions to ask the patient</p>
              <ul className="space-y-1.5">
                {appt.preVisitSummary.suggestedQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-indigo-800">
                    <span className="text-indigo-400 font-bold shrink-0">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Post-visit summary (read-only) */}
      {appt.postVisitSummary && (
        <Card title="Post-visit Summary" icon="📋" fallback={appt.postVisitSummary.isFallback}>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {appt.postVisitSummary.patientFriendlySummary}
          </p>
        </Card>
      )}

      {/* Prescription (read-only) */}
      {!isConfirmed && appt.prescription?.length > 0 && (
        <Card title="Prescription" icon="💊">
          <div className="space-y-3">
            {appt.prescription.map((item, i) => (
              <div key={i} className="bg-gradient-to-r from-indigo-50 to-violet-50 border border-indigo-100 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.medicine}</p>
                    <p className="text-xs text-indigo-700 font-medium mt-0.5">{item.dosage}</p>
                  </div>
                  <span className="text-xs bg-white border border-indigo-200 text-indigo-600 font-semibold px-2.5 py-1 rounded-full shrink-0">
                    {item.durationDays}d
                  </span>
                </div>
                <p className="text-xs text-gray-500 mt-1.5">{item.frequency}</p>
                {item.notes && <p className="text-xs text-gray-400 mt-1 italic">{item.notes}</p>}
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Notes submission form */}
      {isConfirmed && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-indigo-100 shadow-md p-6 space-y-5">
          <div className="flex items-center gap-2 pb-4 border-b border-indigo-50">
            <span className="text-lg">📝</span>
            <h2 className="text-sm font-bold text-gray-800">Submit Post-visit Notes</h2>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">Clinical Notes * <span className="text-xs font-normal text-gray-400">(English, min 20 characters)</span></label>
            <div className="relative">
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                required
                rows={4}
                maxLength={5000}
                placeholder="Diagnosis, observations, follow-up instructions…"
                className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 resize-none bg-gray-50 focus:bg-white transition-colors"
              />
              <span className={`absolute bottom-3 right-4 text-xs ${
                notes.length > 4500 ? "text-amber-500 font-semibold" :
                notes.length < 20  ? "text-red-400" : "text-gray-300"
              }`}>{notes.length}/5000</span>
            </div>
          </div>

          {/* Prescription builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <label className="text-sm font-semibold text-gray-700">💊 Prescription</label>
              <button
                type="button"
                onClick={addItem}
                className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
                </svg>
                Add medicine
              </button>
            </div>

            {prescription.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded-xl border border-dashed border-gray-200">
                <p className="text-xs text-gray-400">No medicines added yet. Click "Add medicine" to start.</p>
              </div>
            )}

            <div className="space-y-3">
              {prescription.map((item, i) => (
                <div key={i} className="border border-indigo-100 rounded-2xl p-4 bg-gradient-to-br from-indigo-50/50 to-violet-50/50 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-indigo-600 bg-indigo-100 px-2.5 py-1 rounded-full">
                      Medicine {i + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => removeItem(i)}
                      className="text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Remove
                    </button>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Medicine *</label>
                      <input
                        value={item.medicine}
                        onChange={(e) => updateItem(i, "medicine", e.target.value)}
                        required
                        placeholder="e.g. Paracetamol"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Dosage *</label>
                      <input
                        value={item.dosage}
                        onChange={(e) => updateItem(i, "dosage", e.target.value)}
                        required
                        placeholder="e.g. 500mg"
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Frequency *</label>
                      <select
                        value={item.frequency}
                        onChange={(e) => updateItem(i, "frequency", e.target.value)}
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      >
                        {FREQUENCIES.map(f => <option key={f}>{f}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-gray-500 mb-1 block">Duration (days) *</label>
                      <input
                        type="number"
                        min={1}
                        value={item.durationDays}
                        onChange={(e) => updateItem(i, "durationDays", Number(e.target.value))}
                        required
                        className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="text-xs font-medium text-gray-500 mb-1 block">Notes (optional)</label>
                    <input
                      value={item.notes}
                      onChange={(e) => updateItem(i, "notes", e.target.value)}
                      placeholder="e.g. Take after meals"
                      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-white"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-60 text-white font-semibold text-sm py-3 transition-all duration-150 shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            {isPending ? "Submitting…" : "Submit Notes & Mark Completed ✓"}
          </button>
        </form>
      )}

      {/* Status history */}
      {history?.length > 0 && (
        <Card title="Status History" icon="🕐">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-indigo-100" />
            <ul className="space-y-4 pl-8">
              {history.map((h, i) => (
                <li key={h._id ?? i} className="relative">
                  <div className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-indigo-400 border-2 border-white shadow-sm" />
                  <p className="text-xs font-semibold text-gray-700">{h.fromStatus ?? "—"} → {h.toStatus}</p>
                  {h.reason && <p className="text-xs text-gray-400 mt-0.5">{h.reason}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">{timeAgo(h.timestamp ?? h.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}
    </div>
  );
}

const Card = ({ title, icon, children, fallback }) => (
  <div className="bg-white rounded-2xl border border-indigo-100 shadow-md p-5">
    <div className="flex items-center gap-2 mb-4">
      <span className="text-lg">{icon}</span>
      <h2 className="text-sm font-bold text-gray-800">{title}</h2>
      {fallback && (
        <span className="text-xs bg-amber-100 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-full ml-auto">
          AI unavailable
        </span>
      )}
    </div>
    {children}
  </div>
);
