import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getDoctorAppointments } from "../../api/doctor.api";
import { slotLabel, formatDate } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";
import { isToday } from "date-fns";
import useAuth from "../../hooks/useAuth";

const FILTERS = ["all", "confirmed", "completed", "cancelled"];

export default function DoctorDashboard() {
  const { user } = useAuth();
  const [filter, setFilter] = useState("all");

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ["doctorAppointments", filter],
    queryFn:  () => getDoctorAppointments(filter === "all" ? undefined : filter),
  });

  const todayList  = appointments.filter(a => isToday(new Date(a.slotStart)) && a.status === "confirmed");
  const confirmed  = appointments.filter(a => a.status === "confirmed");
  const completed  = appointments.filter(a => a.status === "completed");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative rounded-3xl bg-gradient-to-r from-indigo-600 via-indigo-700 to-violet-700 p-8 overflow-hidden shadow-xl shadow-indigo-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-indigo-200 text-sm font-medium mb-1">{greeting}, Dr. {user.name?.split(" ")[0]} 👨‍⚕️</p>
          <h1 className="text-3xl font-bold text-white mb-1">Your Schedule</h1>
          <p className="text-indigo-200 text-sm mb-0">{formatDate(new Date())}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: "Today's Patients", value: todayList.length,  color: "from-indigo-400 to-indigo-600",  icon: "👥" },
          { label: "Upcoming",         value: confirmed.length,  color: "from-violet-400 to-violet-600",  icon: "📅" },
          { label: "Completed",        value: completed.length,  color: "from-slate-500 to-slate-700",    icon: "✅" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br ${color} flex items-center gap-4 shadow-md`}>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{value}</p>
              <p className="text-sm text-white/80 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Today's appointments */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-md overflow-hidden">
        <div className="px-6 py-5 border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-gray-800">Today's Schedule</h2>
            <p className="text-xs text-gray-400 mt-0.5">Confirmed appointments for today</p>
          </div>
          {todayList.length > 0 && (
            <span className="text-xs font-bold bg-indigo-600 text-white px-2.5 py-1 rounded-full">
              {todayList.length}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : todayList.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">🗓️</div>
            <p className="text-sm font-medium text-gray-500">No appointments today</p>
            <p className="text-xs text-gray-400 mt-1">Enjoy your free day!</p>
          </div>
        ) : (
          <ul className="divide-y divide-indigo-50">
            {todayList.map((appt) => (
              <li key={appt._id} className="px-6 py-4 flex items-center justify-between hover:bg-indigo-50/50 transition-colors group">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm">
                    {appt.patientId?.name?.[0] ?? "P"}
                  </div>
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{appt.patientId?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{slotLabel(appt.slotStart)}</p>
                  </div>
                </div>
                <Link
                  to={`/doctor/appointments/${appt._id}`}
                  className="text-xs font-semibold text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
                >
                  Open →
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* All appointments */}
      <div className="bg-white rounded-3xl border border-indigo-100 shadow-md overflow-hidden">
        <div className="px-6 py-5 border-b border-indigo-50 bg-gradient-to-r from-indigo-50 to-violet-50 flex items-center justify-between flex-wrap gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-800">All Appointments</h2>
            <p className="text-xs text-gray-400 mt-0.5">Filter by status</p>
          </div>
          <div className="flex gap-2 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold capitalize transition-all duration-150 ${
                  filter === f
                    ? "bg-gradient-to-r from-indigo-500 to-violet-500 text-white shadow-md"
                    : "bg-white border border-indigo-200 text-indigo-600 hover:border-indigo-400"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="w-8 h-8 border-3 border-indigo-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm text-gray-500">No appointments found</p>
          </div>
        ) : (
          <ul className="divide-y divide-indigo-50">
            {appointments.map((appt) => (
              <li key={appt._id} className="px-6 py-4 flex items-center justify-between gap-4 hover:bg-indigo-50/40 transition-colors group">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-100 to-violet-100 flex items-center justify-center text-indigo-700 font-bold text-sm shadow-sm shrink-0">
                    {appt.patientId?.name?.[0] ?? "P"}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{appt.patientId?.name}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{slotLabel(appt.slotStart)}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                    {statusLabel(appt.status)}
                  </span>
                  <Link
                    to={`/doctor/appointments/${appt._id}`}
                    className="text-xs font-medium text-indigo-600 hover:text-indigo-700 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 rounded-lg transition-colors"
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
