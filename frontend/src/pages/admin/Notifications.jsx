import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { adminGetNotifications } from "../../api/admin.api";
import { timeAgo } from "../../utils/dateUtils";

const TABS = [
  { label: "All",    value: "",       color: "text-purple-600 border-purple-500" },
  { label: "Queued", value: "queued", color: "text-amber-600 border-amber-500"   },
  { label: "Sent",   value: "sent",   color: "text-emerald-600 border-emerald-500" },
  { label: "Failed", value: "failed", color: "text-red-600 border-red-500"       },
];

const TYPE_LABELS = {
  confirmation:       "Confirmation",
  reminder:           "Reminder",
  cancellation:       "Cancellation",
  medication_reminder: "Medication",
};

const statusStyle = (s) => ({
  sent:   "bg-emerald-100 text-emerald-700",
  failed: "bg-red-100 text-red-600",
  queued: "bg-amber-100 text-amber-700",
}[s] ?? "bg-gray-100 text-gray-600");

const typeStyle = (t) => ({
  confirmation:        "bg-teal-50 text-teal-700",
  reminder:            "bg-blue-50 text-blue-700",
  cancellation:        "bg-red-50 text-red-600",
  medication_reminder: "bg-violet-50 text-violet-700",
}[t] ?? "bg-gray-50 text-gray-600");

export default function Notifications() {
  const [activeTab, setActiveTab] = useState("");

  const { data, isLoading, refetch, isRefetching } = useQuery({
    queryKey: ["adminNotifs", activeTab],
    queryFn:  () => adminGetNotifications(activeTab || undefined),
    staleTime: 0,
  });

  const summary       = data?.summary       ?? { queued: 0, sent: 0, failed: 0 };
  const notifications = data?.notifications ?? [];

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Notifications</h1>
          <p className="text-sm text-gray-400 mt-1">Email delivery status and retry queue</p>
        </div>
        <button
          onClick={() => refetch()}
          disabled={isRefetching}
          className="flex items-center gap-2 text-sm font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
        >
          <svg className={`w-4 h-4 ${isRefetching ? "animate-spin" : ""}`} fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          Refresh
        </button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { label: "Queued",  value: summary.queued, color: "from-amber-400 to-amber-500",     icon: "📬" },
          { label: "Sent",    value: summary.sent,   color: "from-emerald-400 to-emerald-500", icon: "✅" },
          { label: "Failed",  value: summary.failed, color: "from-red-400 to-red-500",         icon: "⚠️" },
        ].map(({ label, value, color, icon }) => (
          <div key={label} className={`rounded-2xl p-5 bg-gradient-to-br ${color} flex items-center gap-4 shadow-md`}>
            <div className="w-11 h-11 rounded-xl bg-white/20 flex items-center justify-center text-xl">{icon}</div>
            <div>
              <p className="text-2xl font-bold text-white">{value}</p>
              <p className="text-sm text-white/80 font-medium">{label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Filter tabs */}
      <div className="bg-white rounded-3xl border border-purple-100 shadow-md overflow-hidden">
        <div className="flex border-b border-purple-50">
          {TABS.map((tab) => (
            <button
              key={tab.value}
              onClick={() => setActiveTab(tab.value)}
              className={`flex-1 py-3.5 text-sm font-semibold transition-colors border-b-2 ${
                activeTab === tab.value
                  ? `${tab.color} bg-purple-50/50`
                  : "text-gray-400 border-transparent hover:text-gray-600 hover:bg-gray-50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="py-16 text-center">
            <div className="text-4xl mb-3">🔔</div>
            <p className="text-sm font-medium text-gray-500">No notifications found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-purple-50/50 border-b border-purple-100">
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Recipient</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Subject</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Type</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Status</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">Retries</th>
                  <th className="px-5 py-3.5 text-xs font-bold text-gray-500 uppercase tracking-wide text-left">When</th>
                </tr>
              </thead>
              <tbody>
                {notifications.map((n, i) => (
                  <tr key={n._id} className={`border-b border-purple-50 hover:bg-purple-50/30 transition-colors ${i % 2 === 0 ? "" : "bg-gray-50/20"}`}>
                    <td className="px-5 py-3.5">
                      <p className="font-semibold text-gray-800">{n.recipientId?.name ?? "—"}</p>
                      <p className="text-xs text-gray-400">{n.recipientId?.email ?? ""}</p>
                    </td>
                    <td className="px-5 py-3.5 text-gray-700 max-w-[220px]">
                      <p className="truncate">{n.emailPayload?.subject ?? "—"}</p>
                      {n.errorMessage && (
                        <p className="text-xs text-red-400 truncate mt-0.5" title={n.errorMessage}>
                          ✕ {n.errorMessage}
                        </p>
                      )}
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${typeStyle(n.type)}`}>
                        {TYPE_LABELS[n.type] ?? n.type}
                      </span>
                    </td>
                    <td className="px-5 py-3.5">
                      <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${statusStyle(n.status)}`}>
                        {n.status}
                      </span>
                    </td>
                    <td className="px-5 py-3.5 text-gray-500 text-xs font-medium">
                      {n.retryCount ?? 0}
                    </td>
                    <td className="px-5 py-3.5 text-gray-400 text-xs whitespace-nowrap">
                      {timeAgo(n.createdAt)}
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
