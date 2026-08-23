import { useEffect, useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useSearchParams } from "react-router-dom";
import { getCalendarStatus, getCalendarConnectUrl, disconnectCalendar } from "../../api/calendar.api";
import { getMe, updateMe } from "../../api/auth.api";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";

const Toggle = ({ enabled, onChange, disabled }) => (
  <button
    type="button"
    onClick={() => onChange(!enabled)}
    disabled={disabled}
    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors duration-200 focus:outline-none disabled:opacity-50 ${
      enabled ? "bg-teal-500" : "bg-gray-200"
    }`}
  >
    <span className={`inline-block h-4 w-4 transform rounded-full bg-white shadow transition-transform duration-200 ${
      enabled ? "translate-x-6" : "translate-x-1"
    }`} />
  </button>
);

export default function CalendarSettings() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const isPatient = authUser?.role === "patient";

  // Show toast based on OAuth redirect result
  useEffect(() => {
    const result = params.get("calendar");
    if (!result) return;
    if (result === "connected")   toast.success("Google Calendar connected!");
    else if (result === "denied") toast("Calendar connection cancelled.", { icon: "ℹ️" });
    else if (result === "error")  toast.error("Google Calendar connection failed. Try again.");
    setParams({}, { replace: true });
  }, []);

  const { data: calData, isLoading: calLoading } = useQuery({
    queryKey: ["calendarStatus"],
    queryFn:  getCalendarStatus,
    staleTime: 0,
  });

  const { data: userData, isLoading: userLoading } = useQuery({
    queryKey: ["me"],
    queryFn:  getMe,
    enabled:  isPatient, // only fetch full user doc when patient needs prefs
  });

  // Local prefs state — initialised from server once loaded
  const serverPrefs = userData?.notificationPreferences;
  const [prefs, setPrefs] = useState(null);
  useEffect(() => {
    if (serverPrefs && !prefs) {
      setPrefs({
        appointmentReminder: serverPrefs.appointmentReminder ?? true,
        medicationReminder:  serverPrefs.medicationReminder  ?? true,
        calendarUpdates:     serverPrefs.calendarUpdates     ?? true,
      });
    }
  }, [serverPrefs]);

  const { mutate: connect, isPending: connecting } = useMutation({
    mutationFn: async () => {
      const url = await getCalendarConnectUrl();
      window.location.href = url;
    },
    onError: () => toast.error("Could not get Google authorization URL."),
  });

  const { mutate: disconnect, isPending: disconnecting } = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["calendarStatus"] });
      toast.success("Google Calendar disconnected.");
    },
    onError: () => toast.error("Failed to disconnect. Try again."),
  });

  const { mutate: savePrefs, isPending: saving } = useMutation({
    mutationFn: (newPrefs) => updateMe({ notificationPreferences: newPrefs }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["me"] });
      toast.success("Preferences saved.");
    },
    onError: () => toast.error("Failed to save preferences."),
  });

  const handleToggle = (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    savePrefs(updated);
  };

  const connected = calData?.connected ?? false;

  const prefItems = [
    {
      key: "appointmentReminder",
      label: "Appointment reminder",
      description: "Email 24 hours before your confirmed appointment.",
    },
    {
      key: "medicationReminder",
      label: "Medication reminders",
      description: "Periodic emails reminding you to take prescribed medicines.",
    },
    {
      key: "calendarUpdates",
      label: "Calendar event updates",
      description: "Update your Google Calendar event when the doctor completes your visit.",
    },
  ];

  return (
    <div className="max-w-xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">Settings</h1>
        <p className="text-sm text-gray-400 mt-1">Manage integrations and notification preferences</p>
      </div>

      {/* Google Calendar */}
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-gray-100">
          <span className="text-base">📅</span>
          <h2 className="text-sm font-bold text-gray-800">Google Calendar</h2>
          {!calLoading && (
            <span className={`ml-auto text-xs font-semibold px-2.5 py-0.5 rounded-full ${
              connected ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-500"
            }`}>
              {connected ? "Connected" : "Not connected"}
            </span>
          )}
        </div>

        <p className="text-xs text-gray-500 leading-relaxed mb-5">
          {connected
            ? "Your appointments automatically appear in Google Calendar. Events are created on booking and removed on cancellation."
            : "Connect to automatically sync appointment bookings and cancellations to your Google Calendar."}
        </p>

        {calLoading ? (
          <div className="h-10 w-40 bg-gray-100 rounded-xl animate-pulse" />
        ) : connected ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-emerald-600 font-medium">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Syncing active
            </div>
            <button
              onClick={() => disconnect()}
              disabled={disconnecting}
              className="ml-auto text-xs font-semibold text-red-500 hover:text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 px-4 py-2 rounded-xl transition-colors disabled:opacity-50"
            >
              {disconnecting ? "Disconnecting…" : "Disconnect"}
            </button>
          </div>
        ) : (
          <button
            onClick={() => connect()}
            disabled={connecting}
            className="flex items-center gap-2 text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 disabled:opacity-60 px-5 py-2.5 rounded-xl transition-all shadow-md shadow-blue-200 hover:shadow-lg hover:-translate-y-0.5"
          >
            <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none">
              <rect x="3" y="4" width="18" height="17" rx="2" stroke="white" strokeWidth="1.8"/>
              <path d="M3 9h18M8 2v4M16 2v4" stroke="white" strokeWidth="1.8" strokeLinecap="round"/>
            </svg>
            {connecting ? "Redirecting…" : "Connect Google Calendar"}
          </button>
        )}
      </div>

      {/* Notification preferences — patients only */}
      {isPatient && (
      <div className="bg-white rounded-3xl border border-gray-100 shadow-md p-6">
        <div className="flex items-center gap-2 mb-2 pb-4 border-b border-gray-100">
          <span className="text-base">🔔</span>
          <h2 className="text-sm font-bold text-gray-800">Notification Preferences</h2>
        </div>

        <p className="text-xs text-gray-400 mb-5 mt-3">
          Booking confirmations and cancellation emails are always sent and cannot be disabled.
        </p>

        {/* Mandatory — always on, non-interactive */}
        <div className="space-y-1 mb-4">
          {[
            { label: "Booking confirmation email", description: "Sent immediately when you confirm an appointment." },
            { label: "Cancellation email",         description: "Sent when an appointment is cancelled by you or the doctor." },
          ].map((item) => (
            <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-gray-50">
              <div className="min-w-0 pr-4">
                <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <span className="text-xs text-gray-400 font-medium">Always on</span>
                <Toggle enabled={true} onChange={() => {}} disabled={true} />
              </div>
            </div>
          ))}
        </div>

        {/* Optional toggles */}
        {userLoading || !prefs ? (
          <div className="space-y-4">
            {[1, 2, 3].map(i => <div key={i} className="h-12 bg-gray-100 rounded-xl animate-pulse" />)}
          </div>
        ) : (
          <div className="space-y-1">
            {prefItems.map((item) => (
              <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-gray-50 last:border-0">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-semibold text-gray-700">{item.label}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{item.description}</p>
                </div>
                <Toggle
                  enabled={prefs[item.key]}
                  onChange={(val) => handleToggle(item.key, val)}
                  disabled={saving}
                />
              </div>
            ))}
          </div>
        )}
      </div>
      )}

      <div className="bg-blue-50 border border-blue-100 rounded-2xl px-5 py-4 flex gap-3">
        <svg className="w-4 h-4 text-blue-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p className="text-xs text-blue-600 leading-relaxed">
          Changes to notification preferences take effect immediately for future notifications.
          Preferences only apply to your own account.
        </p>
      </div>
    </div>
  );
}
