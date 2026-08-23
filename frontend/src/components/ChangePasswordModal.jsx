import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { changePassword } from '../api/auth.api';
import toast from 'react-hot-toast';
import Modal from './common/Modal.jsx';
import { Spinner } from './common/index.jsx';

function getStrength(pw) {
  if (!pw) return 0;
  let s = 0;
  if (pw.length >= 6) s++;
  if (pw.length >= 10) s++;
  if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
  return s;
}

const PORTAL_RING = { teal: 'focus:ring-patient', indigo: 'focus:ring-doctor', purple: 'focus:ring-admin' };
const PORTAL_BTN  = { teal: 'bg-patient hover:bg-patient-dark', indigo: 'bg-doctor hover:bg-doctor-dark', purple: 'bg-admin hover:bg-admin-dark' };

export default function ChangePasswordModal({ onClose, accentColor = 'teal' }) {
  const [form, setForm]     = useState({ currentPassword: '', newPassword: '', confirmPassword: '' });
  const [show, setShow]     = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const ring = PORTAL_RING[accentColor] ?? PORTAL_RING.teal;
  const btn  = PORTAL_BTN[accentColor]  ?? PORTAL_BTN.teal;
  const strength = getStrength(form.newPassword);
  const STRENGTH_LABEL = ['', 'Weak', 'Fair', 'Strong'];
  const STRENGTH_COLOR = ['', 'bg-danger', 'bg-warn', 'bg-ok'];

  const { mutate, isPending } = useMutation({
    mutationFn: () => changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    onSuccess: () => { toast.success('Password changed successfully.'); onClose(); },
    onError: err => toast.error(err.response?.data?.message || 'Failed to change password.'),
  });

  const handleSubmit = e => {
    e.preventDefault();
    if (form.newPassword.length < 6) { toast.error('New password must be at least 6 characters.'); return; }
    if (form.newPassword.length > 72) { toast.error('Password must be 72 characters or fewer.'); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error('Passwords do not match.'); return; }
    mutate();
  };

  const fields = [
    { label: 'Current Password', key: 'currentPassword' },
    { label: 'New Password',     key: 'newPassword' },
    { label: 'Confirm Password', key: 'confirmPassword' },
  ];

  return (
    <Modal isOpen={true} onClose={onClose} title="Change Password">
      <form onSubmit={handleSubmit} className="space-y-4">
        {fields.map(({ label, key }) => (
          <div key={key}>
            <label className="block text-xs font-semibold text-ink-soft mb-1">{label}</label>
            <div className="relative">
              <input
                type={show[key] ? 'text' : 'password'}
                value={form[key]}
                onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
                required
                placeholder="••••••••"
                className={`w-full rounded-md border border-stone px-4 py-2.5 pr-14 text-sm focus:outline-none focus:ring-2 ${ring} bg-paper focus:bg-white text-ink transition-colors`}
              />
              <button type="button" onClick={() => setShow(s => ({ ...s, [key]: !s[key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs font-medium select-none">
                {show[key] ? 'Hide' : 'Show'}
              </button>
            </div>
            {key === 'newPassword' && form.newPassword && (
              <div className="mt-1.5">
                <div className="flex gap-1 mb-1">
                  {[1, 2, 3].map(i => (
                    <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= strength ? STRENGTH_COLOR[strength] : 'bg-stone'}`} />
                  ))}
                </div>
                <p className="font-mono text-[10px] text-ink-soft">{STRENGTH_LABEL[strength]} · 6–72 characters</p>
              </div>
            )}
          </div>
        ))}
        <button
          type="submit" disabled={isPending}
          className={`w-full rounded-xl ${btn} disabled:opacity-60 text-white font-bold text-sm py-3 transition-all duration-150 hover:shadow-pop hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2`}
        >
          {isPending ? <><Spinner className="w-4 h-4" /> Saving…</> : 'Change Password'}
        </button>
      </form>
    </Modal>
  );
}
