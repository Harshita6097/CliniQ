import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppointments, useCancelAppointment } from "../../hooks/useAppointments";
import { slotLabel } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";

const FILTERS = ["all", "confirmed", "completed", "cancelled", "held"];

export default function MyAppointments() {
  const [filter, setFilter]         = useState("all");
  const [cancelId, setCancelId]     = useState(null);
  const [cancelReason, setReason]   = useState("");

  const { data: appointments = [], isLoading } = useAppointments(filter === "all" ? undefined : filter);
  const { mutate: cancel, isPending }          = useCancelAppointment();

  const handleCancel = () => {
    if (!cancelId) return;
    cancel({ id: cancelId, reason: cancelReason || "Cancelled by patient" }, {
      onSuccess: () => { setCancelId(null); setReason(""); },
    });
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">My Appointments</h1>

      {/* Filter tabs */}
      <div className="flex gap-2 mb-6 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-1.5 rounded-full text-xs font-medium capitalize transition-colors ${
              filter === f
                ? "bg-blue-600 text-white"
                : "bg-white border border-gray-200 text-gray-600 hover:bg-gray-50"
            }`}
          >
            {f}
          </button>
        ))}
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">Loading…</p>
      ) : appointments.length === 0 ? (
        <p className="text-sm text-gray-400">No appointments found.</p>
      ) : (
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 divide-y divide-gray-100">
          {appointments.map((appt) => (
            <div key={appt._id} className="px-6 py-4 flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-gray-800 truncate">
                  Dr. {appt.doctorId?.name}
                </p>
                <p className="text-xs text-gray-500 mt-0.5">{slotLabel(appt.slotStart)}</p>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                  {statusLabel(appt.status)}
                </span>
                <Link
                  to={`/patient/appointments/${appt._id}`}
                  className="text-xs text-blue-600 hover:underline"
                >
                  View
                </Link>
                {(appt.status === "confirmed" || appt.status === "held") && (
                  <button
                    onClick={() => setCancelId(appt._id)}
                    className="text-xs text-red-500 hover:underline"
                  >
                    Cancel
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Cancel modal */}
      {cancelId && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 w-full max-w-sm">
            <h3 className="text-base font-semibold text-gray-800 mb-3">Cancel Appointment</h3>
            <textarea
              value={cancelReason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason (optional)"
              rows={3}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm mb-4 focus:outline-none focus:ring-2 focus:ring-red-400 resize-none"
            />
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => { setCancelId(null); setReason(""); }}
                className="px-4 py-2 text-sm text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="px-4 py-2 text-sm font-medium bg-red-600 hover:bg-red-700 disabled:opacity-60 text-white rounded-lg transition-colors"
              >
                {isPending ? "Cancelling…" : "Yes, Cancel"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
