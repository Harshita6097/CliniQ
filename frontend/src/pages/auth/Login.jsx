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

const features = [
  { label: 'Pre-visit AI summaries', sub: 'Gemini analyses your symptoms before the appointment' },
  { label: 'Google Calendar sync', sub: 'Appointments appear automatically in your calendar' },
  { label: '5-minute slot holds', sub: 'Your slot is reserved while you fill in your details' },
];

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [form, setForm]       = useState({ email: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState('');
  const [showPwd, setShowPwd] = useState(false);

  if (isAuthenticated) { navigate(`/${user.role}`, { replace: true }); return null; }

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async e => {
    e.preventDefault();
    setError(''); setLoading(true);
    try {
      const u = await login(form.email, form.password);
      toast.success(`Welcome back, ${u.name}!`);
      navigate(`/${u.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed. Please try again.');
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
            Your health,<br />our priority.
          </h2>
          <p className="text-white/80 text-sm mb-10 leading-relaxed">
            A complete platform connecting patients with doctors — seamlessly, securely, and with care.
          </p>
          <ul className="space-y-5">
            {features.map(({ label, sub }) => (
              <li key={label} className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-md bg-white/15 flex items-center justify-center shrink-0 mt-0.5">
                  <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                    <path d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <p className="text-white text-sm font-semibold">{label}</p>
                  <p className="text-white/70 text-xs mt-0.5">{sub}</p>
                </div>
              </li>
            ))}
          </ul>
        </div>
        <p className="relative text-white/50 text-xs">© 2026 CliniQ. All rights reserved.</p>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex items-center justify-center bg-paper-dim px-6 py-12">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-md bg-patient flex items-center justify-center text-white">
              <Logomark className="w-4 h-4" />
            </div>
            <span className="font-display font-semibold text-ink">CliniQ</span>
          </div>

          <div className="bg-white rounded-lg border-2 border-stone shadow-soft p-8">
            <div className="mb-7">
              <h1 className="font-display text-2xl font-semibold text-ink">Welcome back</h1>
              <p className="text-sm text-ink-soft mt-1">Sign in to your account to continue</p>
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
                <label className="block text-xs font-semibold text-ink mb-1.5">Email address</label>
                <input type="email" name="email" value={form.email} onChange={handleChange} required autoComplete="email" placeholder="you@example.com" className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-ink mb-1.5">Password</label>
                <div className="relative">
                  <input type={showPwd ? 'text' : 'password'} name="password" value={form.password} onChange={handleChange} required autoComplete="current-password" placeholder="••••••••" className={`${inputCls} pr-14`} />
                  <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-3 top-1/2 -translate-y-1/2 text-ink-soft hover:text-ink text-xs font-medium select-none">
                    {showPwd ? 'Hide' : 'Show'}
                  </button>
                </div>
              </div>
              <button
                type="submit" disabled={loading}
                className="w-full rounded-xl bg-patient hover:bg-patient-dark disabled:opacity-60 text-white font-bold py-3 text-sm transition-all duration-150 hover:shadow-pop hover:-translate-y-0.5 mt-2 flex items-center justify-center gap-2"
              >
                {loading ? <><Spinner className="w-4 h-4" /> Signing in…</> : 'Sign in →'}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-stone text-center">
              <p className="text-sm text-ink-soft">
                Don't have an account?{' '}
                <Link to="/register" className="text-patient-dark hover:text-patient font-semibold hover:underline">Create one</Link>
              </p>
            </div>
          </div>

          <div className="mt-4 flex items-start gap-2 bg-patient-dark border border-patient rounded-md px-4 py-3">
            <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-white/80 shrink-0 mt-0.5" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="10" /><path d="M12 16v-4m0-4h.01" />
            </svg>
            <p className="text-xs text-white/90">Doctors &amp; admins — use credentials provided by your administrator.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
