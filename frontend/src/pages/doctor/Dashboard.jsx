import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDoctorAppointments } from "../../api/doctor.api";
import { slotLabel, formatDate } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";
import { isToday } from "date-fns";

const FILTERS = ["all", "confirmed", "completed", "cancelled"];

export default function DoctorDashboard() {
  const [filter, setFilter] = useState("all");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["doctorAppointments", filter],
    queryFn:  () => getDoctorAppointments(filter === "all" ? undefined : filter),
  });

  const todayList = appointments.filter(
    (a) => isToday(new Date(a.slotStart)) && a.status === "confirmed"
  );

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-1">Dashboard</h1>
      <p className="text-sm text-gray-500 mb-8">{formatDate(new Date())}</p>

      {/* Today's appointments */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm mb-8">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">
            Today's Appointments
            {todayList.length > 0 && (
              <span className="ml-2 text-xs font-medium bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                {todayList.length}
              </span>
            )}
          </h2>
        </div>
        {isLoading ? (
          <p className="px-6 py-6 text-sm text-gray-400">Loading…</p>
        ) : todayList.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-400">No confirmed appointments today.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {todayList.map((appt) => (
              <li key={appt._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{appt.patientId?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{slotLabel(appt.slotStart)}</p>
                </div>
                <Link
                  to={`/doctor/appointments/${appt._id}`}
                  className="text-xs text-green-600 hover:underline font-medium"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* All appointments with filter */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between flex-wrap gap-3">
          <h2 className="text-base font-semibold text-gray-700">All Appointments</h2>
          <div className="flex gap-2">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium capitalize transition-colors ${
                  filter === f
                    ? "bg-green-600 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <p className="px-6 py-6 text-sm text-gray-400">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="px-6 py-6 text-sm text-gray-400">No appointments found.</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {appointments.map((appt) => (
              <li key={appt._id} className="px-6 py-4 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-800 truncate">{appt.patientId?.name}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{slotLabel(appt.slotStart)}</p>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                    {statusLabel(appt.status)}
                  </span>
                  <Link
                    to={`/doctor/appointments/${appt._id}`}
                    className="text-xs text-green-600 hover:underline"
                  >
                    View
                  </Link>
                </div>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
