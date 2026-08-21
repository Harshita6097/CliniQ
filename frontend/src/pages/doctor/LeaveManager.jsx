import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDoctorProfile, markLeave, removeLeave } from "../../api/doctor.api";
import { format } from "date-fns";
import toast from "react-hot-toast";

const today = format(new Date(), "yyyy-MM-dd");

export default function LeaveManager() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
  const [pendingDates, setPending]      = useState([]); // staged before submit
  const [conflictInfo, setConflictInfo] = useState(null);

  const { data: profile, isLoading } = useQuery({
    queryKey: ["doctorProfile"],
    queryFn:  getDoctorProfile,
  });

  const { mutate: addLeave, isPending: adding } = useMutation({
    mutationFn: (dates) => markLeave(dates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
      setPending([]);
      setSelectedDate("");
      if (data.cancelledAppointments?.length > 0) {
        setConflictInfo(data.cancelledAppointments);
        toast.success(`Leave saved. ${data.cancelledAppointments.length} appointment(s) cancelled.`);
      } else {
        toast.success("Leave days saved.");
      }
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save leave."),
  });

  const { mutate: deleteLeave, isPending: removing } = useMutation({
    mutationFn: (dates) => removeLeave(dates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["doctorProfile"] });
      toast.success("Leave day removed.");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to remove leave."),
  });

  const stageDate = () => {
    if (!selectedDate) return;
    if (pendingDates.includes(selectedDate)) {
      toast.error("Date already staged."); return;
    }
    if (profile?.leaveDays?.includes(selectedDate)) {
      toast.error("Already a leave day."); return;
    }
    setPending((p) => [...p, selectedDate].sort());
    setSelectedDate("");
  };

  const unstageDate = (d) => setPending((p) => p.filter((x) => x !== d));

  if (isLoading) return <p className="text-sm text-gray-400">Loading…</p>;

  const leaveDays = [...(profile?.leaveDays ?? [])].sort();

  return (
    <div className="max-w-xl">
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Leave Manager</h1>
      <p className="text-sm text-gray-500 mb-8">
        Mark days off. Any confirmed appointments on those days will be automatically cancelled and patients notified.
      </p>

      {/* Add leave */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Add Leave Days</h2>

        <div className="flex gap-2 mb-4">
          <input
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-green-500"
          />
          <button
            onClick={stageDate}
            disabled={!selectedDate}
            className="rounded-lg bg-gray-100 hover:bg-gray-200 disabled:opacity-50 text-gray-700 text-sm font-medium px-4 py-2 transition-colors"
          >
            Stage
          </button>
        </div>

        {/* Staged dates */}
        {pendingDates.length > 0 && (
          <div className="mb-4">
            <p className="text-xs text-gray-500 mb-2">Staged (not yet saved):</p>
            <div className="flex flex-wrap gap-2">
              {pendingDates.map((d) => (
                <span
                  key={d}
                  className="flex items-center gap-1.5 bg-green-50 border border-green-200 text-green-700 text-xs font-medium px-3 py-1 rounded-full"
                >
                  {d}
                  <button
                    onClick={() => unstageDate(d)}
                    className="text-green-500 hover:text-green-700 font-bold leading-none"
                  >
                    ×
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        <button
          onClick={() => addLeave(pendingDates)}
          disabled={pendingDates.length === 0 || adding}
          className="rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white text-sm font-medium px-5 py-2 transition-colors"
        >
          {adding ? "Saving…" : `Save ${pendingDates.length > 0 ? `(${pendingDates.length})` : ""} Leave Days`}
        </button>
      </div>

      {/* Conflict info */}
      {conflictInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 mb-6">
          <p className="text-sm font-medium text-amber-800 mb-2">
            The following appointments were cancelled:
          </p>
          <ul className="space-y-1">
            {conflictInfo.map((a) => (
              <li key={a.id} className="text-xs text-amber-700">
                • {a.patientName} — {format(new Date(a.slotStart), "dd MMM yyyy, hh:mm a")}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setConflictInfo(null)}
            className="mt-3 text-xs text-amber-600 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Current leave days */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5">
        <h2 className="text-sm font-semibold text-gray-700 mb-4">Current Leave Days</h2>
        {leaveDays.length === 0 ? (
          <p className="text-sm text-gray-400">No leave days scheduled.</p>
        ) : (
          <ul className="space-y-2">
            {leaveDays.map((d) => (
              <li key={d} className="flex items-center justify-between text-sm">
                <span className="text-gray-700">{format(new Date(d), "dd MMM yyyy (EEEE)")}</span>
                <button
                  onClick={() => deleteLeave([d])}
                  disabled={removing}
                  className="text-xs text-red-500 hover:underline disabled:opacity-50"
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
