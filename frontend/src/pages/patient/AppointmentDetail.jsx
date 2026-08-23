import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getAppointmentById } from "../../api/appointment.api";
import { useCancelAppointment } from "../../hooks/useAppointments";
import { formatSlot, timeAgo } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";

const urgencyColors = {
  High:   "bg-red-100 text-red-700 border-red-200",
  Medium: "bg-amber-100 text-amber-700 border-amber-200",
  Low:    "bg-emerald-100 text-emerald-700 border-emerald-200",
};

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

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-10 h-10 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );
  if (isError) return (
    <div className="text-center py-20">
      <div className="text-4xl mb-3">⚠️</div>
      <p className="text-sm text-red-500 font-medium">Appointment not found or you don't have access to it.</p>
      <button onClick={() => navigate("/patient/appointments")} className="mt-4 text-sm font-medium text-teal-600 hover:underline">
        ← Back to appointments
      </button>
    </div>
  );

  const { appointment: appt, history } = data;
  const canCancel = appt.status === "confirmed" || appt.status === "held";

  const handleCancel = () => {
    cancel({ id, reason: reason || "Cancelled by patient" }, {
      onSuccess: () => navigate("/patient/appointments"),
    });
  };

  return (
    <div className="max-w-2xl space-y-5 animate-fadeIn">
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-1 text-sm text-teal-600 hover:text-teal-700 font-medium"
      >
        <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Back
      </button>

      {/* Header card */}
      <div className="bg-gradient-to-r from-teal-500 to-cyan-600 rounded-3xl p-6 text-white shadow-xl shadow-teal-200 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="relative">
          <div className="flex items-start justify-between mb-4">
            <div>
              <p className="text-teal-100 text-xs font-medium mb-1">Appointment</p>
              <h1 className="text-xl font-bold">Dr. {appt.doctorId?.name}</h1>
              <p className="text-teal-100 text-sm mt-1">{formatSlot(appt.slotStart)}</p>
            </div>
            <span className={`text-xs font-bold px-3 py-1.5 rounded-full border ${statusClasses(appt.status)}`}>
              {statusLabel(appt.status)}
            </span>
          </div>
          <div className="flex gap-4 text-sm">
            <div className="bg-white/20 rounded-xl px-3 py-2">
              <p className="text-teal-100 text-xs">From</p>
              <p className="font-semibold">{formatSlot(appt.slotStart)}</p>
            </div>
            <div className="bg-white/20 rounded-xl px-3 py-2">
              <p className="text-teal-100 text-xs">To</p>
              <p className="font-semibold">{formatSlot(appt.slotEnd)}</p>
            </div>
          </div>
        </div>
      </div>

      {appt.cancellationReason && (
        <div className="bg-red-50 border border-red-100 rounded-2xl px-5 py-4 flex gap-3">
          <span className="text-lg">❌</span>
          <div>
            <p className="text-sm font-semibold text-red-700">Cancellation Reason</p>
            <p className="text-sm text-red-600 mt-0.5">{appt.cancellationReason}</p>
          </div>
        </div>
      )}

      {/* Symptoms */}
      {appt.symptomFormText && (
        <Card title="Your Symptoms" icon="🩺">
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">{appt.symptomFormText}</p>
        </Card>
      )}

      {/* Pre-visit AI summary */}
      {appt.preVisitSummary && (
        <Card title="Pre-visit AI Summary" icon="🤖" fallback={appt.preVisitSummary.isFallback}>
          {appt.preVisitSummary.urgency && (
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
            <div className="bg-teal-50 rounded-xl p-4">
              <p className="text-xs font-bold text-teal-700 uppercase tracking-wide mb-2">💬 Questions to ask your doctor</p>
              <ul className="space-y-1.5">
                {appt.preVisitSummary.suggestedQuestions.map((q, i) => (
                  <li key={i} className="flex gap-2 text-sm text-teal-800">
                    <span className="text-teal-400 font-bold shrink-0">{i + 1}.</span>
                    {q}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Card>
      )}

      {/* Post-visit summary */}
      {appt.postVisitSummary && (
        <Card title="Post-visit Summary" icon="📋" fallback={appt.postVisitSummary.isFallback}>
          <p className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {appt.postVisitSummary.patientFriendlySummary}
          </p>
        </Card>
      )}

      {/* Prescription */}
      {appt.prescription?.length > 0 && (
        <Card title="Prescription" icon="💊">
          <div className="space-y-3">
            {appt.prescription.map((item, i) => (
              <div key={i} className="bg-gradient-to-r from-teal-50 to-cyan-50 border border-teal-100 rounded-xl px-4 py-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-bold text-gray-800">{item.medicine}</p>
                    <p className="text-xs text-teal-700 font-medium mt-0.5">{item.dosage}</p>
                  </div>
                  <span className="text-xs bg-white border border-teal-200 text-teal-600 font-semibold px-2.5 py-1 rounded-full shrink-0">
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

      {/* Status history */}
      {history?.length > 0 && (
        <Card title="Status History" icon="🕐">
          <div className="relative">
            <div className="absolute left-3 top-0 bottom-0 w-px bg-gray-100" />
            <ul className="space-y-4 pl-8">
              {history.map((h, i) => (
                <li key={h._id ?? i} className="relative">
                  <div className="absolute -left-5 w-2.5 h-2.5 rounded-full bg-teal-400 border-2 border-white shadow-sm" />
                  <p className="text-xs font-semibold text-gray-700">
                    {h.fromStatus ?? "—"} → {h.toStatus}
                  </p>
                  {h.reason && <p className="text-xs text-gray-400 mt-0.5">{h.reason}</p>}
                  <p className="text-xs text-gray-300 mt-0.5">{timeAgo(h.timestamp ?? h.createdAt)}</p>
                </li>
              ))}
            </ul>
          </div>
        </Card>
      )}

      {/* Cancel */}
      {canCancel && !showCancel && (
        <button
          onClick={() => setShowCancel(true)}
          className="text-sm text-red-500 hover:text-red-600 font-medium flex items-center gap-1.5 hover:underline"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
          </svg>
          Cancel this appointment
        </button>
      )}

      {showCancel && (
        <div className="bg-red-50 border border-red-200 rounded-2xl p-5">
          <p className="text-sm font-bold text-red-700 mb-3">⚠️ Confirm cancellation</p>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="Reason (optional)"
            rows={2}
            className="w-full rounded-xl border border-red-200 px-3 py-2.5 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-white"
          />
          <div className="flex gap-3">
            <button
              onClick={handleCancel}
              disabled={isPending}
              className="px-5 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl transition-colors"
            >
              {isPending ? "Cancelling…" : "Yes, Cancel"}
            </button>
            <button
              onClick={() => setShowCancel(false)}
              className="px-5 py-2.5 text-sm font-semibold text-gray-600 bg-white hover:bg-gray-100 rounded-xl border border-gray-200 transition-colors"
            >
              Keep it
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

const Card = ({ title, icon, children, fallback }) => (
  <div className="bg-white rounded-2xl border border-teal-100 shadow-md p-5">
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
