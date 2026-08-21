import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "react-router-dom";
import {
  adminGetNotifications,
  adminGetAllUsers,
  adminGetAllAppointments,
  adminToggleUser,
} from "../../api/admin.api";
import { slotLabel, timeAgo } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";
import toast from "react-hot-toast";
import useAuth from "../../hooks/useAuth";

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const { data: notifData } = useQuery({ queryKey: ["adminNotifs"],         queryFn: () => adminGetNotifications() });
  const { data: userData }  = useQuery({ queryKey: ["adminUsers"],          queryFn: () => adminGetAllUsers() });
  const { data: apptData }  = useQuery({ queryKey: ["adminAppts", "recent"], queryFn: () => adminGetAllAppointments({ status: "confirmed" }) });

  const { mutate: toggleUser } = useMutation({
    mutationFn: adminToggleUser,
    onSuccess: (data) => { queryClient.invalidateQueries({ queryKey: ["adminUsers"] }); toast.success(data.message); },
    onError: () => toast.error("Failed to toggle user."),
  });

  const summary     = notifData?.summary   ?? { queued: 0, sent: 0, failed: 0 };
  const users       = userData?.users      ?? [];
  const recentAppts = (apptData?.appointments ?? []).slice(0, 5);
  const patients    = users.filter(u => u.role === "patient");
  const doctors     = users.filter(u => u.role === "doctor");

  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good morning" : hour < 17 ? "Good afternoon" : "Good evening";

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative rounded-3xl bg-gradient-to-r from-purple-600 via-purple-700 to-fuchsia-700 p-8 overflow-hidden shadow-xl shadow-purple-200">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/10 rounded-full -translate-y-1/2 translate-x-1/4" />
        <div className="absolute bottom-0 left-1/3 w-40 h-40 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <p className="text-purple-200 text-sm font-medium mb-1">{greeting} 👋</p>
          <h1 className="text-3xl font-bold text-white mb-1">{user.name}</h1>
          <p className="text-purple-200 text-sm">System overview — everything at a glance</p>
        </div>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { label: "Patients",    value: patients.length,  color: "from-blue-400 to-blue-600",     icon: "🧑‍🤝‍🧑" },
          { label: "Doctors",     value: doctors.length,   color: "from-emerald-400 to-emerald-600", icon: "👨‍⚕️" },
          { label: "Notif Queued", value: summary.queued,  color: "from-amber-400 to-amber-600",   icon: "📬" },
          { label: "Notif Failed", value: summary.failed,  color: "from-red-400 to-red-600",       icon: "⚠️" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br ${color} flex items-center gap-4 shadow-md`}>
            <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center text-2xl">
              {icon}
            </div>
            <div>
              <p className="text-3xl font-bold text-white">{value ?? "—"}</p>
              <p className="text-sm text-white/80 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent confirmed appointments */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-fuchsia-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">Recent Appointments</h2>
              <p className="text-xs text-gray-400 mt-0.5">Latest confirmed bookings</p>
            </div>
            <Link to="/admin/appointments" className="text-xs font-medium text-purple-600 hover:underline">
              View all →
            </Link>
          </div>
          {recentAppts.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-3xl mb-2">📭</div>
              <p className="text-sm text-gray-400">No confirmed appointments</p>
            </div>
          ) : (
            <ul className="divide-y divide-purple-50">
              {recentAppts.map((appt) => (
                <li key={appt._id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-purple-50/40 transition-colors">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center text-purple-700 font-bold text-sm shrink-0">
                    {appt.patientId?.name?.[0] ?? "P"}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-gray-800 truncate">
                      {appt.patientId?.name} → Dr. {appt.doctorId?.name}
                    </p>
                    <p className="text-xs text-gray-400 mt-0.5">{slotLabel(appt.slotStart)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${statusClasses(appt.status)}`}>
                    {statusLabel(appt.status)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User list */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden">
          <div className="px-6 py-5 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-fuchsia-50 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-gray-800">Users</h2>
              <p className="text-xs text-gray-400 mt-0.5">Manage active status</p>
            </div>
            <Link to="/admin/doctors" className="text-xs font-medium text-purple-600 hover:underline">
              Manage doctors →
            </Link>
          </div>
          {users.length === 0 ? (
            <div className="px-6 py-10 text-center">
              <p className="text-sm text-gray-400">No users found</p>
            </div>
          ) : (
            <ul className="divide-y divide-purple-50 max-h-72 overflow-y-auto">
              {users.slice(0, 20).map((u) => (
                <li key={u._id} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-purple-50/40 transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                      {u.name?.[0] ?? "U"}
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-gray-800 truncate">{u.name}</p>
                      <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${u.isActive ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-600"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => toggleUser(u._id)}
                      className="text-xs font-medium text-purple-600 hover:text-purple-700 bg-purple-50 hover:bg-purple-100 px-2.5 py-1 rounded-lg transition-colors"
                    >
                      Toggle
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notifications */}
        <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden lg:col-span-2">
          <div className="px-6 py-5 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-fuchsia-50">
            <h2 className="text-base font-bold text-gray-800">Recent Notifications</h2>
            <p className="text-xs text-gray-400 mt-0.5">Email delivery status</p>
          </div>
          {(notifData?.notifications ?? []).length === 0 ? (
            <div className="px-6 py-10 text-center">
              <div className="text-3xl mb-2">🔔</div>
              <p className="text-sm text-gray-400">No notifications yet</p>
            </div>
          ) : (
            <ul className="divide-y divide-purple-50 max-h-64 overflow-y-auto">
              {(notifData?.notifications ?? []).slice(0, 10).map((n) => (
                <li key={n._id} className="px-6 py-3.5 flex items-center justify-between gap-4 hover:bg-purple-50/30 transition-colors">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-700 truncate">{n.emailPayload?.subject}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.recipientId?.name} · {timeAgo(n.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-semibold px-2.5 py-1 rounded-full shrink-0 ${
                    n.status === "sent"   ? "bg-emerald-100 text-emerald-700" :
                    n.status === "failed" ? "bg-red-100 text-red-600"         :
                    "bg-amber-100 text-amber-700"
                  }`}>
                    {n.status}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
}
