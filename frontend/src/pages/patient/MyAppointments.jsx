import { useState } from "react";
import { Link } from "react-router-dom";
import { useAppointments, useCancelAppointment } from "../../hooks/useAppointments";
import { slotLabel } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";

const FILTERS = ["all", "confirmed", "completed", "cancelled", "held"];

const filterIcons = { all: "📋", confirmed: "✅", completed: "🏁", cancelled: "❌", held: "⏳" };

export default function MyAppointments() {
  const [filter, setFilter]       = useState("all");
  const [cancelId, setCancelId]   = useState(null);
  const [cancelReason, setReason] = useState("");

  const { data: appointments = [], isLoading } = useAppointments(filter === "all" ? undefined : filter);
  const { mutate: cancel, isPending }          = useCancelAppointment();

  const handleCancel = () => {
    if (!cancelId) return;
    cancel({ id: cancelId, reason: cancelReason || "Cancelled by patient" }, {
      onSuccess: () => { setCancelId(null); setReason(""); },
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">My Appointments</h1>
        <p className="text-sm text-gray-400 mt-1">Track and manage all your visits</p>
      </div>

      {/* Filter pills */}
      <div className="flex gap-2 flex-wrap">
        {FILTERS.map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold capitalize transition-all duration-150 ${
              filter === f
                ? "bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-md shadow-teal-200"
                : "bg-white border border-gray-200 text-gray-500 hover:border-teal-300 hover:text-teal-600"
            }`}
          >
            <span>{filterIcons[f]}</span> {f}
          </button>
        ))}
      </div>

      {/* List */}
      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : appointments.length === 0 ? (
        <div className="bg-white rounded-3xl border border-gray-100 shadow-sm py-16 text-center">
          <div className="text-5xl mb-4">🗓️</div>
          <p className="text-sm font-semibold text-gray-500">No appointments found</p>
          <p className="text-xs text-gray-400 mt-1">Try a different filter or book a new appointment</p>
          <Link to="/patient/book" className="inline-block mt-4 text-sm font-medium text-teal-600 hover:underline">
            Book now →
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((appt, i) => (
            <div
              key={appt._id}
              className="bg-white rounded-2xl border border-teal-100 shadow-sm hover:shadow-lg hover:border-teal-300 hover:-translate-y-0.5 transition-all duration-200 px-5 py-4 flex items-center justify-between gap-4 group"
              style={{ animationDelay: `${i * 40}ms` }}
            >
              <div className="flex items-center gap-4 min-w-0">
                <div className="w-11 h-11 rounded-xl bg-gradient-to-br from-teal-100 to-cyan-100 flex items-center justify-center text-teal-700 font-bold text-base shadow-sm shrink-0">
                  {appt.doctorId?.name?.[0] ?? "D"}
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">Dr. {appt.doctorId?.name}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{slotLabel(appt.slotStart)}</p>
                </div>
              </div>

              <div className="flex items-center gap-3 shrink-0">
                <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                  {statusLabel(appt.status)}
                </span>
                <Link
                  to={`/patient/appointments/${appt._id}`}
                  className="text-xs font-medium text-teal-600 hover:text-teal-700 bg-teal-50 hover:bg-teal-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  View
                </Link>
                {(appt.status === "confirmed" || appt.status === "held") && (
                  <button
                    onClick={() => setCancelId(appt._id)}
                    className="text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors"
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
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
          <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm animate-scaleIn">
            <div className="w-12 h-12 rounded-2xl bg-red-100 flex items-center justify-center text-2xl mb-4">❌</div>
            <h3 className="text-lg font-bold text-gray-800 mb-1">Cancel Appointment?</h3>
            <p className="text-sm text-gray-400 mb-4">This action cannot be undone. Let us know why (optional).</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Reason for cancellation…"
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm mb-5 focus:outline-none focus:ring-2 focus:ring-red-300 resize-none bg-gray-50"
            />
            <div className="flex gap-3">
              <button
                onClick={() => { setCancelId(null); setReason(""); }}
                className="flex-1 px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors"
              >
                Keep it
              </button>
              <button
                onClick={handleCancel}
                disabled={isPending}
                className="flex-1 px-4 py-2.5 text-sm font-semibold bg-red-500 hover:bg-red-600 disabled:opacity-60 text-white rounded-xl transition-colors"
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
