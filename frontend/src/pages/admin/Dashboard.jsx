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

export default function AdminDashboard() {
  const queryClient = useQueryClient();

  const { data: notifData }   = useQuery({ queryKey: ["adminNotifs"],        queryFn: () => adminGetNotifications() });
  const { data: userData }    = useQuery({ queryKey: ["adminUsers"],         queryFn: () => adminGetAllUsers() });
  const { data: apptData }    = useQuery({ queryKey: ["adminAppts", "recent"], queryFn: () => adminGetAllAppointments({ status: "confirmed" }) });

  const { mutate: toggleUser } = useMutation({
    mutationFn: adminToggleUser,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminUsers"] });
      toast.success(data.message);
    },
    onError: () => toast.error("Failed to toggle user."),
  });

  const summary     = notifData?.summary   ?? { queued: 0, sent: 0, failed: 0 };
  const users       = userData?.users      ?? [];
  const recentAppts = (apptData?.appointments ?? []).slice(0, 5);

  const patients = users.filter(u => u.role === "patient");
  const doctors  = users.filter(u => u.role === "doctor");

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-8">Admin Dashboard</h1>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <StatCard label="Total Patients" value={patients.length} color="blue" />
        <StatCard label="Total Doctors"  value={doctors.length}  color="green" />
        <StatCard label="Notifications Queued" value={summary.queued} color="yellow" />
        <StatCard label="Notifications Failed" value={summary.failed} color="red" />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent confirmed appointments */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Recent Confirmed Appointments</h2>
            <Link to="/admin/appointments" className="text-xs text-purple-600 hover:underline">View all</Link>
          </div>
          {recentAppts.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">No confirmed appointments.</p>
          ) : (
            <ul className="divide-y divide-gray-100">
              {recentAppts.map((appt) => (
                <li key={appt._id} className="px-6 py-3">
                  <p className="text-sm font-medium text-gray-800">
                    {appt.patientId?.name} → Dr. {appt.doctorId?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{slotLabel(appt.slotStart)}</p>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* User list with toggle */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="text-base font-semibold text-gray-700">Users</h2>
            <Link to="/admin/doctors" className="text-xs text-purple-600 hover:underline">Manage doctors</Link>
          </div>
          {users.length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">No users found.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-72 overflow-y-auto">
              {users.slice(0, 20).map((u) => (
                <li key={u._id} className="px-6 py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{u.name}</p>
                    <p className="text-xs text-gray-400 capitalize">{u.role}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${u.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                      {u.isActive ? "Active" : "Inactive"}
                    </span>
                    <button
                      onClick={() => toggleUser(u._id)}
                      className="text-xs text-gray-500 hover:text-gray-800 hover:underline"
                    >
                      Toggle
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notification status */}
        <div className="bg-white rounded-2xl border border-gray-100 shadow-sm lg:col-span-2">
          <div className="px-6 py-4 border-b border-gray-100">
            <h2 className="text-base font-semibold text-gray-700">Recent Notifications</h2>
          </div>
          {(notifData?.notifications ?? []).length === 0 ? (
            <p className="px-6 py-6 text-sm text-gray-400">No notifications yet.</p>
          ) : (
            <ul className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {(notifData?.notifications ?? []).slice(0, 10).map((n) => (
                <li key={n._id} className="px-6 py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm text-gray-700 truncate">{n.emailPayload?.subject}</p>
                    <p className="text-xs text-gray-400">{n.recipientId?.name} · {timeAgo(n.createdAt)}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${
                    n.status === "sent"   ? "bg-green-100 text-green-700" :
                    n.status === "failed" ? "bg-red-100 text-red-600"    :
                    "bg-yellow-100 text-yellow-700"
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

const StatCard = ({ label, value, color }) => {
  const colors = {
    blue:   "bg-blue-50 text-blue-700",
    green:  "bg-green-50 text-green-700",
    yellow: "bg-yellow-50 text-yellow-700",
    red:    "bg-red-50 text-red-700",
  };
  return (
    <div className={`rounded-2xl p-5 ${colors[color]}`}>
      <p className="text-3xl font-bold">{value ?? "—"}</p>
      <p className="text-sm mt-1 font-medium opacity-80">{label}</p>
    </div>
  );
};
