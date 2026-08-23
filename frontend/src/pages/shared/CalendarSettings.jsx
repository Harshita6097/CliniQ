import { useEffect, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useSearchParams } from 'react-router-dom';
import { getCalendarStatus, getCalendarConnectUrl, disconnectCalendar } from '../../api/calendar.api';
import { getMe, updateMe } from '../../api/auth.api';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import { Toggle, Spinner } from '../../components/common/index.jsx';

function SavedIndicator({ show }) {
  if (!show) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] font-semibold text-ok animate-fadeIn">
      <svg viewBox="0 0 24 24" fill="none" className="w-3 h-3" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
      Saved
    </span>
  );
}

export default function CalendarSettings() {
  const queryClient = useQueryClient();
  const [params, setParams] = useSearchParams();
  const { user: authUser } = useAuth();
  const isPatient = authUser?.role === 'patient';
  const portal = authUser?.role ?? 'patient';

  const PORTAL_RING = { patient: 'focus:ring-patient', doctor: 'focus:ring-doctor', admin: 'focus:ring-admin' };
  const PORTAL_BTN  = { patient: 'bg-patient hover:bg-patient-dark', doctor: 'bg-doctor hover:bg-doctor-dark', admin: 'bg-admin hover:bg-admin-dark' };
  const ring = PORTAL_RING[portal] ?? PORTAL_RING.patient;
  const btn  = PORTAL_BTN[portal]  ?? PORTAL_BTN.patient;

  useEffect(() => {
    const result = params.get('calendar');
    if (!result) return;
    if (result === 'connected')   toast.success('Google Calendar connected!');
    else if (result === 'denied') toast('Calendar connection cancelled.', { icon: 'ℹ️' });
    else if (result === 'error')  toast.error('Google Calendar connection failed. Try again.');
    setParams({}, { replace: true });
  }, []);

  const { data: calData, isLoading: calLoading } = useQuery({ queryKey: ['calendarStatus'], queryFn: getCalendarStatus, staleTime: 0 });
  const { data: userData, isLoading: userLoading } = useQuery({ queryKey: ['me'], queryFn: getMe });

  const serverPrefs = userData?.notificationPreferences;
  const [prefs, setPrefs] = useState(null);
  const [savedKey, setSavedKey] = useState(null);

  // Profile edit state
  const [profileForm, setProfileForm] = useState({ name: '', phone: '' });
  const [profileSaved, setProfileSaved] = useState(false);

  useEffect(() => {
    if (serverPrefs && !prefs) {
      setPrefs({
        appointmentReminder: serverPrefs.appointmentReminder ?? true,
        medicationReminder:  serverPrefs.medicationReminder  ?? true,
        calendarUpdates:     serverPrefs.calendarUpdates     ?? true,
      });
    }
  }, [serverPrefs]);

  useEffect(() => {
    if (userData && !profileForm.name) {
      setProfileForm({ name: userData.name ?? '', phone: userData.phone ?? '' });
    }
  }, [userData]);

  const { mutate: connect, isPending: connecting } = useMutation({
    mutationFn: async () => { const url = await getCalendarConnectUrl(); window.location.href = url; },
    onError: () => toast.error('Could not get Google authorization URL.'),
  });
  const { mutate: disconnect, isPending: disconnecting } = useMutation({
    mutationFn: disconnectCalendar,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['calendarStatus'] }); toast.success('Google Calendar disconnected.'); },
    onError: () => toast.error('Failed to disconnect. Try again.'),
  });
  const { mutate: savePrefs, isPending: saving } = useMutation({
    mutationFn: newPrefs => updateMe({ notificationPreferences: newPrefs }),
    onSuccess: (_, vars) => { queryClient.invalidateQueries({ queryKey: ['me'] }); },
    onError: () => toast.error('Failed to save preferences.'),
  });
  const { mutate: saveProfile, isPending: savingProfile } = useMutation({
    // TODO: wire to PATCH /api/auth/me
    mutationFn: data => updateMe(data),
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ['me'] }); toast.success('Profile updated.'); setProfileSaved(true); setTimeout(() => setProfileSaved(false), 3000); },
    onError: () => toast.error('Failed to update profile.'),
  });

  const handleToggle = (key, value) => {
    const updated = { ...prefs, [key]: value };
    setPrefs(updated);
    setSavedKey(key);
    setTimeout(() => setSavedKey(null), 2500);
    savePrefs(updated);
  };

  const connected = calData?.connected ?? false;

  const prefItems = [
    { key: 'appointmentReminder', label: 'Appointment reminder', description: 'Email 24 hours before your confirmed appointment.' },
    { key: 'medicationReminder',  label: 'Medication reminders', description: 'Periodic emails reminding you to take prescribed medicines.' },
    { key: 'calendarUpdates',     label: 'Calendar event updates', description: 'Update your Google Calendar event when the doctor completes your visit.' },
  ];

  const inputCls = `w-full rounded-md border border-stone px-4 py-2.5 text-sm focus:outline-none focus:ring-2 ${ring} bg-paper focus:bg-white text-ink transition-colors`;

  return (
    <div className="max-w-xl space-y-6 animate-fadeIn">
      <div>
        <h1 className="font-display text-2xl font-semibold text-ink">Settings</h1>
        <p className="text-sm text-ink-soft mt-1">Manage your profile, integrations, and notification preferences</p>
      </div>

      {/* Profile section */}
      <div className="bg-white rounded-lg border border-stone shadow-soft p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-stone">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-ink-soft" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 00-4-4H8a4 4 0 00-4 4v2" /><circle cx="12" cy="7" r="4" /></svg>
          <h2 className="text-sm font-semibold text-ink">Profile</h2>
        </div>
        {userLoading ? (
          <div className="space-y-3"><div className="h-10 bg-stone rounded-md animate-pulse" /><div className="h-10 bg-stone rounded-md animate-pulse" /></div>
        ) : (
          <div className="space-y-4">
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Full name</label>
              <input type="text" value={profileForm.name} onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-ink-soft mb-1.5">Phone <span className="font-normal text-stone-dark">(optional)</span></label>
              <input type="tel" value={profileForm.phone} onChange={e => setProfileForm(f => ({ ...f, phone: e.target.value }))} placeholder="+91 98765 43210" className={inputCls} />
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => saveProfile({ name: profileForm.name, phone: profileForm.phone || undefined })}
                disabled={savingProfile}
                className={`rounded-xl ${btn} disabled:opacity-60 text-white font-bold text-sm px-5 py-2.5 transition-all hover:shadow-pop hover:-translate-y-0.5 flex items-center gap-2`}
              >
                {savingProfile ? <><Spinner className="w-4 h-4" /> Saving…</> : 'Save Profile'}
              </button>
              <SavedIndicator show={profileSaved} />
            </div>
          </div>
        )}
      </div>

      {/* Google Calendar */}
      <div className="bg-white rounded-lg border border-stone shadow-soft p-6">
        <div className="flex items-center gap-2 mb-5 pb-4 border-b border-stone">
          <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-ink-soft" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
          <h2 className="text-sm font-semibold text-ink">Google Calendar</h2>
          {!calLoading && (
            <span className={`ml-auto font-mono text-[10px] font-semibold px-2.5 py-0.5 rounded-full ${connected ? 'bg-ok-tint text-ok' : 'bg-paper-dim text-ink-soft'}`}>
              {connected ? 'Connected' : 'Not connected'}
            </span>
          )}
        </div>
        <p className="text-xs text-ink-soft leading-relaxed mb-5">
          {connected
            ? 'Your appointments automatically appear in Google Calendar. Events are created on booking and removed on cancellation.'
            : 'Connect to automatically sync appointment bookings and cancellations to your Google Calendar.'}
        </p>
        {calLoading ? (
          <div className="h-10 w-40 bg-stone rounded-md animate-pulse" />
        ) : connected ? (
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 text-sm text-ok font-semibold">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><path d="M5 13l4 4L19 7" /></svg>
              Syncing active
            </div>
            <button onClick={() => disconnect()} disabled={disconnecting} className="ml-auto text-xs font-semibold text-danger bg-danger-tint hover:bg-danger/20 border border-danger/20 px-4 py-2 rounded-md transition-colors disabled:opacity-50">
              {disconnecting ? 'Disconnecting…' : 'Disconnect'}
            </button>
          </div>
        ) : (
          <button onClick={() => connect()} disabled={connecting} className="flex items-center gap-2 text-sm font-semibold text-white bg-admin hover:bg-admin-dark disabled:opacity-60 px-5 py-2.5 rounded-xl transition-all hover:shadow-pop hover:-translate-y-0.5">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="4" width="18" height="18" rx="2" /><path d="M16 2v4M8 2v4M3 10h18" /></svg>
            {connecting ? 'Redirecting…' : 'Connect Google Calendar'}
          </button>
        )}
      </div>

      {/* Notification preferences — patients only */}
      {isPatient && (
        <div className="bg-white rounded-lg border border-stone shadow-soft p-6">
          <div className="flex items-center gap-2 mb-2 pb-4 border-b border-stone">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-ink-soft" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 006 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 01-3.46 0" /></svg>
            <h2 className="text-sm font-semibold text-ink">Notification Preferences</h2>
          </div>
          <p className="text-xs text-ink-soft mb-5 mt-3">Booking confirmations and cancellation emails are always sent and cannot be disabled.</p>
          <div className="space-y-1 mb-4">
            {[
              { label: 'Booking confirmation email', description: 'Sent immediately when you confirm an appointment.' },
              { label: 'Cancellation email', description: 'Sent when an appointment is cancelled by you or the doctor.' },
            ].map(item => (
              <div key={item.label} className="flex items-center justify-between py-3.5 border-b border-stone/50">
                <div className="min-w-0 pr-4">
                  <p className="text-sm font-semibold text-ink">{item.label}</p>
                  <p className="text-xs text-ink-soft mt-0.5">{item.description}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-mono text-[10px] text-stone-dark font-medium">Always on</span>
                  <Toggle enabled={true} onChange={() => {}} disabled={true} portal="patient" />
                </div>
              </div>
            ))}
          </div>
          {userLoading || !prefs ? (
            <div className="space-y-4">{[1,2,3].map(i => <div key={i} className="h-12 bg-stone rounded-md animate-pulse" />)}</div>
          ) : (
            <div className="space-y-1">
              {prefItems.map(item => (
                <div key={item.key} className="flex items-center justify-between py-3.5 border-b border-stone/50 last:border-0">
                  <div className="min-w-0 pr-4">
                    <p className="text-sm font-semibold text-ink">{item.label}</p>
                    <p className="text-xs text-ink-soft mt-0.5">{item.description}</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <SavedIndicator show={savedKey === item.key} />
                    <Toggle enabled={prefs[item.key]} onChange={val => handleToggle(item.key, val)} disabled={saving} portal="patient" />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      <div className={`flex items-start gap-3 rounded-md px-5 py-4 ${
        portal === 'doctor' ? 'bg-doctor-tint border border-doctor/20' :
        portal === 'admin'  ? 'bg-admin-tint border border-admin/20' :
                              'bg-patient-tint border border-patient/20'
      }`}>
        <svg viewBox="0 0 24 24" fill="none" className={`w-4 h-4 shrink-0 mt-0.5 ${
          portal === 'doctor' ? 'text-doctor' : portal === 'admin' ? 'text-admin' : 'text-patient'
        }`} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round"><circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" /></svg>
        <p className={`text-xs leading-relaxed ${
          portal === 'doctor' ? 'text-doctor-dark' : portal === 'admin' ? 'text-admin-dark' : 'text-patient-dark'
        }`}>Changes to notification preferences take effect immediately for future notifications. Preferences only apply to your own account.</p>
      </div>
    </div>
  );
}
