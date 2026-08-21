import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getDoctorProfile, markLeave, removeLeave } from "../../api/doctor.api";
import { format } from "date-fns";
import toast from "react-hot-toast";

const today = format(new Date(), "yyyy-MM-dd");

export default function LeaveManager() {
  const queryClient = useQueryClient();
  const [selectedDate, setSelectedDate] = useState("");
  const [pendingDates, setPending]      = useState([]);
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
    if (pendingDates.includes(selectedDate)) { toast.error("Date already staged."); return; }
    if (profile?.leaveDays?.includes(selectedDate)) { toast.error("Already a leave day."); return; }
    setPending(p => [...p, selectedDate].sort());
    setSelectedDate("");
  };

  if (isLoading) return (
    <div className="flex items-center justify-center py-24">
      <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  const leaveDays = [...(profile?.leaveDays ?? [])].sort();

  return (
    <div className="max-w-xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Leave Manager</h1>
        <p className="text-sm text-gray-400 mt-1">
          Mark days off — confirmed appointments on those days will be cancelled and patients notified.
        </p>
      </div>

      {/* Add leave card */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-md p-6 space-y-5">
        <div className="flex items-center gap-2 pb-4 border-b border-indigo-50">
          <span className="text-lg">📅</span>
          <h2 className="text-sm font-bold text-gray-800">Add Leave Days</h2>
        </div>

        <div className="flex gap-3">
          <input
            type="date"
            value={selectedDate}
            min={today}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400 bg-gray-50 focus:bg-white transition-colors"
          />
          <button
            onClick={stageDate}
            disabled={!selectedDate}
            className="rounded-xl bg-indigo-50 hover:bg-indigo-100 disabled:opacity-50 text-indigo-700 font-semibold text-sm px-5 py-2.5 transition-colors border border-indigo-200"
          >
            Stage
          </button>
        </div>

        {/* Staged chips */}
        {pendingDates.length > 0 && (
          <div>
            <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-2">Staged (not yet saved)</p>
            <div className="flex flex-wrap gap-2">
              {pendingDates.map((d) => (
                <span
                  key={d}
                  className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-200 text-indigo-700 text-xs font-semibold px-3 py-1.5 rounded-full"
                >
                  {format(new Date(d), "dd MMM yyyy")}
                  <button
                    onClick={() => setPending(p => p.filter(x => x !== d))}
                    className="text-indigo-400 hover:text-indigo-700 font-bold leading-none ml-0.5"
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
          className="w-full rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700 disabled:opacity-50 text-white font-semibold text-sm py-3 transition-all duration-150 shadow-md shadow-indigo-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          {adding ? "Saving…" : `Save ${pendingDates.length > 0 ? `${pendingDates.length} ` : ""}Leave Day${pendingDates.length !== 1 ? "s" : ""}`}
        </button>
      </div>

      {/* Conflict warning */}
      {conflictInfo && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5">
          <div className="flex items-center gap-2 mb-3">
            <span className="text-lg">⚠️</span>
            <p className="text-sm font-bold text-amber-800">Appointments cancelled due to leave</p>
          </div>
          <ul className="space-y-1.5 mb-4">
            {conflictInfo.map((a) => (
              <li key={a.id} className="flex items-center gap-2 text-xs text-amber-700">
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400 shrink-0" />
                {a.patientName} — {format(new Date(a.slotStart), "dd MMM yyyy, hh:mm a")}
              </li>
            ))}
          </ul>
          <button
            onClick={() => setConflictInfo(null)}
            className="text-xs font-medium text-amber-600 hover:text-amber-700 hover:underline"
          >
            Dismiss
          </button>
        </div>
      )}

      {/* Current leave days */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-md p-6">
        <div className="flex items-center gap-2 pb-4 border-b border-indigo-50 mb-4">
          <span className="text-lg">🗓️</span>
          <h2 className="text-sm font-bold text-gray-800">Scheduled Leave Days</h2>
          {leaveDays.length > 0 && (
            <span className="ml-auto text-xs font-bold bg-indigo-100 text-indigo-700 px-2.5 py-1 rounded-full">
              {leaveDays.length}
            </span>
          )}
        </div>

        {leaveDays.length === 0 ? (
          <div className="text-center py-8">
            <div className="text-4xl mb-3">✅</div>
            <p className="text-sm text-gray-500 font-medium">No leave days scheduled</p>
            <p className="text-xs text-gray-400 mt-1">You're available every day</p>
          </div>
        ) : (
          <ul className="space-y-2">
            {leaveDays.map((d) => (
              <li key={d} className="flex items-center justify-between bg-indigo-50/50 rounded-xl px-4 py-3 border border-indigo-100">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-indigo-100 flex items-center justify-center text-indigo-600 text-sm font-bold">
                    {format(new Date(d), "dd")}
                  </div>
                  <span className="text-sm font-medium text-gray-700">
                    {format(new Date(d), "MMMM yyyy (EEEE)")}
                  </span>
                </div>
                <button
                  onClick={() => deleteLeave([d])}
                  disabled={removing}
                  className="text-xs font-medium text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors disabled:opacity-50"
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
