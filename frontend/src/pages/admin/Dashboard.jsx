import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { adminGetNotifications, adminGetAllUsers, adminGetAllAppointments, adminToggleUser } from '../../api/admin.api';
import { slotLabel, timeAgo } from '../../utils/dateUtils';
import { StatusBadge, SkeletonLoader } from '../../components/common/index.jsx';
import Modal from '../../components/common/Modal.jsx';
import Button from '../../components/common/Button.jsx';
import toast from 'react-hot-toast';
import useAuth from '../../hooks/useAuth';
import PulseThread from '../../components/common/PulseThread.jsx';

export default function AdminDashboard() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [toggleTarget, setToggleTarget] = useState(null);

  const { data: notifData, isLoading: notifLoading } = useQuery({ queryKey: ['adminNotifs'], queryFn: () => adminGetNotifications() });
  const { data: userData,  isLoading: userLoading  } = useQuery({ queryKey: ['adminUsers'],  queryFn: () => adminGetAllUsers() });
  const { data: apptData,  isLoading: apptLoading  } = useQuery({ queryKey: ['adminAppts', 'recent'], queryFn: () => adminGetAllAppointments({ status: 'confirmed' }) });

  const { mutate: toggleUser, isPending: toggling } = useMutation({
    mutationFn: adminToggleUser,
    onSuccess: data => { queryClient.invalidateQueries({ queryKey: ['adminUsers'] }); toast.success(data.message); setToggleTarget(null); },
    onError: () => toast.error('Failed to toggle user.'),
  });

  const summary     = notifData?.summary   ?? { queued: 0, sent: 0, failed: 0 };
  const users       = userData?.users      ?? [];
  const recentAppts = (apptData?.appointments ?? []).slice(0, 5);
  const patients    = users.filter(u => u.role === 'patient');
  const doctors     = users.filter(u => u.role === 'doctor');

  const hour = new Date().getHours();
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Hero */}
      <div className="relative rounded-lg bg-gradient-to-r from-admin-dark via-admin to-admin-light p-8 overflow-hidden shadow-pop chart-paper">
        <PulseThread color="#ffffff" opacity={0.25} />
        <div className="relative">
          <p className="text-admin-tint text-sm font-medium mb-1">{greeting}</p>
          <h1 className="font-display text-3xl font-semibold text-white mb-1">{user.name}</h1>
          <p className="text-admin-tint text-sm">System overview — everything at a glance</p>
        </div>
      </div>

      {/* Stats */}
      {userLoading || notifLoading ? <SkeletonLoader variant="stat" count={4} /> : (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { label: 'Patients',      value: patients.length,  tint: 'bg-patient-tint', text: 'text-patient-dark', href: '/admin/appointments',
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" /><circle cx="9" cy="7" r="4" /><path d="M23 21v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" /></svg> },
            { label: 'Doctors',       value: doctors.length,   tint: 'bg-doctor-tint',  text: 'text-doctor-dark',  href: '/admin/doctors',
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M2 12h4l2-7 4 14 3-9 2 2h5" /></svg> },
            { label: 'Emails Queued', value: summary.queued,   tint: 'bg-warn-tint',    text: 'text-warn',         href: '/admin/notifications',
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" /><path d="M22 6l-10 7L2 6" /></svg> },
            { label: 'Emails Failed', value: summary.failed,   tint: 'bg-danger-tint',  text: 'text-danger',       href: '/admin/notifications',
              icon: <svg viewBox="0 0 24 24" fill="none" className="w-5 h-5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" /></svg> },
          ].map(({ label, value, tint, text, href, icon }) => (
            <Link key={label} to={href} className={`rounded-lg p-5 ${tint} flex items-center gap-4 border border-stone/50 hover:shadow-pop hover:-translate-y-0.5 transition-all duration-150`}>
              <div className={`w-11 h-11 rounded-md bg-white/60 flex items-center justify-center ${text} shadow-soft`}>{icon}</div>
              <div>
                <p className={`font-mono text-2xl font-bold ${text}`}>{value ?? '—'}</p>
                <p className={`text-xs font-semibold ${text} opacity-80`}>{label}</p>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Recent appointments */}
        <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-stone bg-paper-dim flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Recent Appointments</h2>
              <p className="text-xs text-ink-soft mt-0.5">Latest confirmed bookings</p>
            </div>
            <Link to="/admin/appointments" className="text-xs font-semibold text-admin hover:underline">View all →</Link>
          </div>
          {apptLoading ? <div className="p-6"><SkeletonLoader variant="row" count={3} /></div> : recentAppts.length === 0 ? (
            <div className="px-6 py-10 text-center"><p className="text-sm text-ink-soft">No confirmed appointments</p></div>
          ) : (
            <ul className="divide-y divide-stone/50">
              {recentAppts.map(appt => (
                <li key={appt._id} className="px-6 py-3.5 flex items-center gap-4 hover:bg-paper-dim transition-colors">
                  <div className="w-9 h-9 rounded-md bg-admin-tint flex items-center justify-center text-admin-dark font-bold text-sm shrink-0">{appt.patientId?.name?.[0] ?? 'P'}</div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-semibold text-ink truncate">{appt.patientId?.name} → Dr. {appt.doctorId?.name}</p>
                    <p className="font-mono text-xs text-ink-soft mt-0.5">{slotLabel(appt.slotStart)}</p>
                  </div>
                  <StatusBadge status={appt.status} />
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Users */}
        <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden">
          <div className="px-6 py-5 border-b border-stone bg-paper-dim flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Users</h2>
              <p className="text-xs text-ink-soft mt-0.5">Manage active status</p>
            </div>
            <Link to="/admin/doctors" className="text-xs font-semibold text-admin hover:underline">Manage doctors →</Link>
          </div>
          {userLoading ? <div className="p-6"><SkeletonLoader variant="row" count={4} /></div> : users.length === 0 ? (
            <div className="px-6 py-10 text-center"><p className="text-sm text-ink-soft">No users found</p></div>
          ) : (
            <ul className="divide-y divide-stone/50 max-h-72 overflow-y-auto">
              {users.slice(0, 20).map(u => (
                <li key={u._id} className="px-6 py-3 flex items-center justify-between gap-3 hover:bg-paper-dim transition-colors">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-8 h-8 rounded-full bg-admin-tint flex items-center justify-center text-admin-dark font-bold text-xs shrink-0">{u.name?.[0] ?? 'U'}</div>
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-ink truncate">{u.name}</p>
                      <p className="font-mono text-[10px] text-ink-soft capitalize">{u.role}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className={`font-mono text-[10px] font-semibold px-2 py-0.5 rounded-full ${u.isActive ? 'bg-ok-tint text-ok' : 'bg-danger-tint text-danger'}`}>
                      {u.isActive ? 'active' : 'inactive'}
                    </span>
                    <button onClick={() => setToggleTarget(u)} className="text-xs font-semibold text-admin bg-admin-tint hover:bg-admin-tint2 px-2.5 py-1 rounded-md transition-colors">Toggle</button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Notifications summary widget */}
        <div className="bg-white rounded-lg border border-stone shadow-soft overflow-hidden lg:col-span-2">
          <div className="px-6 py-5 border-b border-stone bg-paper-dim flex items-center justify-between">
            <div>
              <h2 className="font-display text-base font-semibold text-ink">Notification Summary</h2>
              <p className="text-xs text-ink-soft mt-0.5">Email delivery status</p>
            </div>
            <Link to="/admin/notifications" className="text-xs font-semibold text-admin hover:underline">View all →</Link>
          </div>
          {notifLoading ? <div className="p-6"><SkeletonLoader variant="row" count={2} /></div> : (
            <div className="px-6 py-5 grid grid-cols-3 gap-4">
              {[
                { label: 'Queued', value: summary.queued, tint: 'bg-warn-tint', text: 'text-warn' },
                { label: 'Sent',   value: summary.sent,   tint: 'bg-ok-tint',   text: 'text-ok' },
                { label: 'Failed', value: summary.failed, tint: 'bg-danger-tint', text: 'text-danger' },
              ].map(({ label, value, tint, text }) => (
                <div key={label} className={`rounded-md p-4 ${tint} text-center`}>
                  <p className={`font-mono text-2xl font-bold ${text}`}>{value}</p>
                  <p className={`text-xs font-semibold ${text} opacity-80 mt-0.5`}>{label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Toggle confirm modal */}
      <Modal isOpen={!!toggleTarget} onClose={() => setToggleTarget(null)} title={`${toggleTarget?.isActive ? 'Deactivate' : 'Reactivate'} user?`}>
        <p className="text-sm text-ink-soft mb-5">
          {toggleTarget?.isActive
            ? `${toggleTarget?.name} will be deactivated and cannot log in.`
            : `${toggleTarget?.name} will be reactivated and can log in again.`}
        </p>
        <div className="flex gap-3">
          <button onClick={() => setToggleTarget(null)} className="flex-1 px-4 py-2.5 text-sm font-semibold text-ink-soft bg-paper-dim hover:bg-stone rounded-xl transition-colors">Cancel</button>
          <Button variant={toggleTarget?.isActive ? 'destructive' : 'primary'} portal="admin" onClick={() => toggleUser(toggleTarget?._id)} disabled={toggling} className="flex-1">
            {toggling ? 'Saving…' : toggleTarget?.isActive ? 'Deactivate' : 'Reactivate'}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
