import { Link } from "react-router-dom";
import { useAppointments } from "../../hooks/useAppointments";
import useAuth from "../../hooks/useAuth";
import { slotLabel } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";

export default function PatientDashboard() {
  const { user } = useAuth();
  const { data: appointments = [], isLoading } = useAppointments();

  const upcoming = appointments
    .filter((a) => a.status === "confirmed" && new Date(a.slotStart) > new Date())
    .slice(0, 5);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800">Welcome, {user.name}</h1>
      <p className="text-sm text-gray-500 mt-1 mb-8">Here's a summary of your upcoming appointments.</p>

      <div className="flex gap-4 mb-8">
        <Link
          to="/patient/book"
          className="rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-sm font-medium px-5 py-2.5 transition-colors"
        >
          + Book Appointment
        </Link>
        <Link
          to="/patient/appointments"
          className="rounded-xl border border-gray-300 hover:bg-gray-100 text-gray-700 text-sm font-medium px-5 py-2.5 transition-colors"
        >
          View All Appointments
        </Link>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="px-6 py-4 border-b border-gray-100">
          <h2 className="text-base font-semibold text-gray-700">Upcoming Appointments</h2>
        </div>

        {isLoading ? (
          <p className="px-6 py-8 text-sm text-gray-400">Loading…</p>
        ) : upcoming.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">No upcoming appointments. Book one now!</p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {upcoming.map((appt) => (
              <li key={appt._id} className="px-6 py-4 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">
                    Dr. {appt.doctorId?.name}
                  </p>
                  <p className="text-xs text-gray-500 mt-0.5">{slotLabel(appt.slotStart)}</p>
                </div>
                <div className="flex items-center gap-3">
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                    {statusLabel(appt.status)}
                  </span>
                  <Link
                    to={`/patient/appointments/${appt._id}`}
                    className="text-xs text-blue-600 hover:underline"
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
