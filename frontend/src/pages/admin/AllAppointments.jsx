import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminGetAllAppointments } from "../../api/admin.api";
import { formatSlot } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";
import { format } from "date-fns";

const STATUSES = ["", "confirmed", "completed", "cancelled", "held"];

export default function AllAppointments() {
  const [filters, setFilters] = useState({
    status: "", doctorId: "", patientId: "", from: "", to: "",
  });
  const [applied, setApplied] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["adminAllAppts", applied],
    queryFn:  () => {
      const params = {};
      if (applied.status)   params.status   = applied.status;
      if (applied.doctorId) params.doctorId  = applied.doctorId;
      if (applied.patientId) params.patientId = applied.patientId;
      if (applied.from)     params.from      = applied.from;
      if (applied.to)       params.to        = applied.to;
      return adminGetAllAppointments(params);
    },
  });

  const appointments = data?.appointments ?? [];
  const total        = data?.total ?? 0;

  const handleApply = (e) => {
    e.preventDefault();
    setApplied({ ...filters });
  };

  const handleReset = () => {
    const empty = { status: "", doctorId: "", patientId: "", from: "", to: "" };
    setFilters(empty);
    setApplied({});
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">All Appointments</h1>

      {/* Filters */}
      <form
        onSubmit={handleApply}
        className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 mb-6"
      >
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
          <div>
            <label className="block text-xs text-gray-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s || "All"}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">From date</label>
            <input
              type="date"
              value={filters.from}
              onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>

          <div>
            <label className="block text-xs text-gray-500 mb-1">To date</label>
            <input
              type="date"
              value={filters.to}
              onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))}
              className="w-full rounded-lg border border-gray-300 px-3 py-2 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500"
            />
          </div>
        </div>

        <div className="flex gap-2">
          <button
            type="submit"
            className="rounded-lg bg-purple-600 hover:bg-purple-700 text-white text-sm font-medium px-5 py-2 transition-colors"
          >
            Apply Filters
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-gray-300 hover:bg-gray-50 text-gray-600 text-sm font-medium px-5 py-2 transition-colors"
          >
            Reset
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="text-base font-semibold text-gray-700">Results</h2>
          {!isLoading && (
            <span className="text-xs text-gray-400">{total} appointment{total !== 1 ? "s" : ""}</span>
          )}
        </div>

        {isLoading ? (
          <p className="px-6 py-8 text-sm text-gray-400">Loading…</p>
        ) : appointments.length === 0 ? (
          <p className="px-6 py-8 text-sm text-gray-400">No appointments match the selected filters.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 text-left">
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Patient</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Doctor</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Slot</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Status</th>
                  <th className="px-6 py-3 text-xs font-semibold text-gray-500 uppercase tracking-wide">Booked</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {appointments.map((appt) => (
                  <tr key={appt._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">{appt.patientId?.name}</p>
                      <p className="text-xs text-gray-400">{appt.patientId?.email}</p>
                    </td>
                    <td className="px-6 py-3">
                      <p className="font-medium text-gray-800">Dr. {appt.doctorId?.name}</p>
                      <p className="text-xs text-gray-400">{appt.doctorId?.email}</p>
                    </td>
                    <td className="px-6 py-3 text-gray-700 whitespace-nowrap">
                      {formatSlot(appt.slotStart)}
                    </td>
                    <td className="px-6 py-3">
                      <span className={`text-xs font-medium px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                        {statusLabel(appt.status)}
                      </span>
                    </td>
                    <td className="px-6 py-3 text-gray-400 text-xs whitespace-nowrap">
                      {format(new Date(appt.createdAt), "dd MMM yyyy")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
