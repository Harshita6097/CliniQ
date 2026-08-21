import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminGetAllAppointments } from "../../api/admin.api";
import { formatSlot } from "../../utils/dateUtils";
import { statusClasses, statusLabel } from "../../utils/statusBadge";
import { format } from "date-fns";

const STATUSES = ["", "confirmed", "completed", "cancelled", "held"];

export default function AllAppointments() {
  const [filters, setFilters] = useState({ status: "", doctorId: "", patientId: "", from: "", to: "" });
  const [applied, setApplied] = useState({});

  const { data, isLoading } = useQuery({
    queryKey: ["adminAllAppts", applied],
    queryFn: () => {
      const params = {};
      if (applied.status)    params.status    = applied.status;
      if (applied.doctorId)  params.doctorId  = applied.doctorId;
      if (applied.patientId) params.patientId = applied.patientId;
      if (applied.from)      params.from      = applied.from;
      if (applied.to)        params.to        = applied.to;
      return adminGetAllAppointments(params);
    },
  });

  const appointments = data?.appointments ?? [];
  const total        = data?.total ?? 0;

  const handleApply = (e) => { e.preventDefault(); setApplied({ ...filters }); };
  const handleReset = () => {
    const empty = { status: "", doctorId: "", patientId: "", from: "", to: "" };
    setFilters(empty); setApplied({});
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">All Appointments</h1>
        <p className="text-sm text-gray-400 mt-1">System-wide appointment records with filters</p>
      </div>

      {/* Filters */}
      <form onSubmit={handleApply} className="bg-white rounded-3xl border border-purple-100 shadow-md p-6">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-base">🔍</span>
          <h2 className="text-sm font-bold text-gray-800">Filter Appointments</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 mb-5">
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">Status</label>
            <select
              value={filters.status}
              onChange={(e) => setFilters(f => ({ ...f, status: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 focus:bg-white transition-colors"
            >
              {STATUSES.map(s => <option key={s} value={s}>{s || "All statuses"}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">From date</label>
            <input
              type="date" value={filters.from}
              onChange={(e) => setFilters(f => ({ ...f, from: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1">To date</label>
            <input
              type="date" value={filters.to}
              onChange={(e) => setFilters(f => ({ ...f, to: e.target.value }))}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 focus:bg-white transition-colors"
            />
          </div>
        </div>
        <div className="flex gap-3">
          <button type="submit"
            className="rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-sm font-semibold px-5 py-2.5 transition-all shadow-md shadow-purple-200">
            Apply Filters
          </button>
          <button type="button" onClick={handleReset}
            className="rounded-xl border border-gray-200 hover:bg-gray-50 text-gray-600 text-sm font-semibold px-5 py-2.5 transition-colors">
            Reset
          </button>
        </div>
      </form>

      {/* Results */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden">
        <div className="px-6 py-5 border-b border-purple-50 bg-gradient-to-r from-purple-50 to-fuchsia-50 flex items-center justify-between">
          <h2 className="text-base font-bold text-gray-800">Results</h2>
          {!isLoading && (
            <span className="text-xs font-semibold bg-purple-100 text-purple-700 px-3 py-1 rounded-full">
              {total} appointment{total !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : appointments.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">📭</div>
            <p className="text-sm font-medium text-gray-500">No appointments match the selected filters</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50/50 border-b border-purple-100">
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Patient</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Doctor</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Slot</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Status</th>
                  <th className="px-6 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Booked</th>
                </tr>
              </thead>
              <tbody>
                {appointments.map((appt, i) => (
                  <tr key={appt._id} className={`border-b border-purple-50 hover:bg-purple-50/40 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/30"}`}>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center text-purple-700 font-bold text-xs shrink-0">
                          {appt.patientId?.name?.[0] ?? "P"}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{appt.patientId?.name}</p>
                          <p className="text-xs text-gray-400">{appt.patientId?.email}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <p className="font-semibold text-gray-800">Dr. {appt.doctorId?.name}</p>
                      <p className="text-xs text-gray-400">{appt.doctorId?.email}</p>
                    </td>
                    <td className="px-6 py-4 text-gray-700 whitespace-nowrap font-medium">
                      {formatSlot(appt.slotStart)}
                    </td>
                    <td className="px-6 py-4">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusClasses(appt.status)}`}>
                        {statusLabel(appt.status)}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-400 text-xs whitespace-nowrap">
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
