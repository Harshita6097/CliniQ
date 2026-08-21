import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentById } from "../../api/appointment.api";
import { useCancelAppointment } from "../../hooks/useAppointments";
import { formatSlot, timeAgo } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";

export default function PatientAppointmentDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [showCancel, setShowCancel] = useState(false);
  const [reason, setReason]         = useState("");

  const { data, isLoading, isError } = useQuery({
    queryKey: ["appointment", id],
    queryFn:  () => getAppointmentById(id),
  });

  const { mutate: cancel, isPending } = useCancelAppointment();

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;
  if (isError)   return <p className="text-sm text-red-500">Failed to load appointment.</p>;

  const { appointment: appt, history } = data;
  const canCancel = appt.status === "confirmed" || appt.status === "held";

  const handleCancel = () => {
    cancel({ id, reason: reason || "Cancelled by patient" }, {
      onSuccess: () => navigate("/patient/appointments"),
    });
  };

  return (
    <div className="max-w-2xl">
      <button
        onClick={() => navigate(-1)}
        className="text-sm text-blue-600 hover:underline mb-5 block"
      >
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

      {/* Core info */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-4 space-y-2">
        <Row label="Doctor"    value={`Dr. ${appt.doctorId?.name}`} />
        <Row label="Slot"      value={`${formatSlot(appt.slotStart)} → ${formatSlot(appt.slotEnd)}`} />
        {appt.cancellationReason && (
          <Row label="Cancellation reason" value={appt.cancellationReason} />
        )}
      </div>

      {/* Symptom form */}
      {appt.symptomFormText && (
        <Section title="Your Symptoms">
          <p className="text-sm text-gray-700 whitespace-pre-wrap">{appt.symptomFormText}</p>
        </Section>
      )}

      {/* Pre-visit summary */}
      {appt.preVisitSummary && (
        <Section title="Pre-visit AI Summary" fallback={appt.preVisitSummary.isFallback}>
          {appt.preVisitSummary.urgency && (
            <p className="text-sm mb-1">
              <span className="font-medium">Urgency:</span> {appt.preVisitSummary.urgency}
            </p>
          )}
          <p className="text-sm mb-2">
            <span className="font-medium">Chief complaint:</span> {appt.preVisitSummary.chiefComplaint}
          </p>
          {appt.preVisitSummary.suggestedQuestions?.length > 0 && (
            <div>
              <p className="text-sm font-medium mb-1">Suggested questions for your doctor:</p>
              <ul className="list-disc list-inside text-sm text-gray-600 space-y-0.5">
                {appt.preVisitSummary.suggestedQuestions.map((q, i) => (
                  <li key={i}>{q}</li>
                ))}
              </ul>
            </div>
          )}
        </Section>
      )}

      {/* Post-visit summary */}
      {appt.postVisitSummary && (
        <Section title="Post-visit Summary" fallback={appt.postVisitSummary.isFallback}>
          <p className="text-sm text-gray-700 whitespace-pre-wrap">
            {appt.postVisitSummary.patientFriendlySummary}
          </p>
        </Section>
      )}

      {/* Prescription */}
      {appt.prescription?.length > 0 && (
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

      {/* Cancel */}
      {canCancel && !showCancel && (
        <button
          onClick={() => setShowCancel(true)}
          className="mt-4 text-sm text-red-500 hover:underline"
        >
          Cancel this appointment
        </button>
      )}

      {showCancel && (
        <div className="mt-4 bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-sm font-medium text-red-700 mb-2">Confirm cancellation</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={2}
            className="w-full rounded-lg border border-red-200 px-3 py-2 text-sm mb-3 focus:outline-none resize-none"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-colors"
            >
              {isPending ? "Cancelling…" : "Yes, Cancel"}
            </button>
            <button
              onClick={() => setShowCancel(false)}
              className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Small helpers ────────────────────────────────────────────────────────────
const Row = ({ label, value }) => (
  <div className="flex gap-2 text-sm">
    <span className="text-gray-500 w-36 shrink-0">{label}</span>
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
