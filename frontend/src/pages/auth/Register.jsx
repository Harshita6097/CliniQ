import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import toast from 'react-hot-toast';
import PulseThread from '../../components/common/PulseThread.jsx';
import { Spinner } from '../../components/common/index.jsx';

const Logomark = ({ className = 'w-6 h-6' }) => (
  <svg viewBox="0 0 24 24" fill="none" className={className}>
    <path d="M2 12h4l2-7 4 14 3-9 2 2h5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function StrengthMeter({ password }) {
  const getStrength = pw => {
    if (!pw) return 0;
    let s = 0;
    if (pw.length >= 6) s++;
    if (pw.length >= 10) s++;
    if (/[A-Z]/.test(pw) && /[0-9]/.test(pw)) s++;
    return s;
  };
  const s = getStrength(password);
  const LABEL = ['', 'Weak', 'Fair', 'Strong'];
  const COLOR = ['', 'bg-danger', 'bg-warn', 'bg-ok'];
  if (!password) return null;
  return (
    <div className="mt-1.5">
      <div className="flex gap-1 mb-1">
        {[1, 2, 3].map(i => (
          <div key={i} className={`h-1 flex-1 rounded-full transition-colors ${i <= s ? COLOR[s] : 'bg-stone'}`} />
        ))}
      </div>
      <p className="font-mono text-[10px] text-ink-soft">{LABEL[s]} · 6–72 characters required</p>
    </div>
  );
}

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]         = useState({ name: '', email: '', password: '', confirmPassword: '', phone: '' });
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');
  const [showPwd, setShowPwd]   = useState(false);
  const [showConf, setShowConf] = useState(false);

  if (isAuthenticated) { navigate(`/${user.role}`, { replace: true }); return null; }

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault(); setError('');
    if (form.password !== form.confirmPassword) { setError('Passwords do not match.'); return; }
    if (form.password.length < 6) { setError('Password must be at least 6 characters.'); return; }
    if (form.password.length > 72) { setError('Password must be 72 characters or fewer.'); return; }
    setLoading(true);
    try {
      const { name, email, password, phone } = form;
      const newUser = await register({ name, email, password, phone, role: 'patient' });
      toast.success(`Account created! Welcome, ${newUser.name}. 🎉`);
      navigate('/patient', { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Registration failed. Please try again.');
    } finally { setLoading(false); }
  };

  const inputCls = 'w-full rounded-md border border-stone px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-patient bg-paper focus:bg-white transition-colors text-ink placeholder:text-stone-dark';

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 relative flex-col justify-between p-12 overflow-hidden bg-patient-dark">
        <PulseThread color="#ffffff" opacity={0.3} />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-md bg-white/20 flex items-center justify-center text-white">
              <Logomark className="w-6 h-6" />
            </div>
            <div>
              <p className="text-white font-display font-semibold text-lg leading-tight">CliniQ</p>
              <p className="text-white/70 text-xs">Healthcare Appointment Manager</p>
            </div>
          </div>
        </div>
        <div className="relative">
          <h2 className="font-display text-4xl font-semibold text-white leading-tight mb-4">
            Join thousands<br />of patients.
          </h2>
          <p className="text-white/80 text-sm mb-10 leading-relaxed">
            Create your free account and start managing your health appointments with ease.
          </p>
          <ul className="space-y-4">
            {[
              { label: 'Your data is private & secure' },
              { label: 'Verified doctors only' },
              { label: 'Book appointments instantly' },
              { label: 'Get reminders & follow-ups' },
            ].map(({ label }) => (
              <li key={label} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center shrink-0">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <span className="text-white/80 text-sm font-medium">{label}</span>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-white/50 text-xs">© 2026 CliniQ. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-paper-dim px-6 py-12">
        <div className="w-full max-w-md animate-fadeIn">
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-patient flex items-center justify-center text-white">
              <Logomark className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-ink">CliniQ</span>
          </div>

          <div className="bg-white rounded-lg border-2 border-stone shadow-soft p-8">
            <div className="mb-7">
              <h1 className="font-display text-2xl font-semibold text-ink">Create your account</h1>
              <p className="text-sm text-ink-soft mt-1">Patient registration — free &amp; takes 30 seconds</p>
            </div>

            {error && (
              <div className="mb-5 rounded-md bg-danger-tint border border-danger/30 px-4 py-3 flex gap-2 items-start">
                <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-danger shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M12 9v4m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                </svg>
                <p className="text-sm text-danger">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Full name</label>
                <input type="text" name="name" value={form.name} onChange={handleChange} required placeholder="Jane Doe" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Email address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Phone <span className="font-normal text-ink-soft">(optional)</span></label>
                <input type="tel" name="phone" value={form.phone} onChange={handleChange} placeholder="+91 98765 43210" className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Password</label>
                  <div className="relative">
                    <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required autoComplete="new-password" placeholder="Min. 6 chars" className={`${inputCls} pr-14`} />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs font-medium select-none">{showPwd ? 'Hide' : 'Show'}</button>
                  </div>
                  <StrengthMeter password={form.password} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-ink mb-1.5">Confirm</label>
                  <div className="relative">
                    <input type={showConf ? 'text' : 'password'} name="confirmPassword" value={form.confirmPassword} onChange={handleChange} required autoComplete="new-password" placeholder="••••••••" className={`${inputCls} pr-14`} />
                    <button type="button" onClick={() => setShowConf(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs font-medium select-none">{showConf ? 'Hide' : 'Show'}</button>
                  </div>
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full rounded-xl bg-patient hover:bg-patient-dark disabled:opacity-60 text-white font-bold py-3 text-sm transition-all duration-150 hover:shadow-pop hover:-translate-y-0.5 mt-1 flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner className="w-4 h-4" /> Creating account…</> : 'Create account →'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-stone text-center">
              <p className="text-sm text-ink-soft">
                Already have an account?{' '}
                <Link to="/login" className="text-patient-dark hover:text-patient font-semibold hover:underline">Sign in</Link>
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 bg-patient-dark border border-patient rounded-md px-4 py-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/80 shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
            </svg>
            <p className="text-xs text-white/90">Doctors are added by admin — contact your administrator for access.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
