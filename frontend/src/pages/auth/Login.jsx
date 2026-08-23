import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";

const features = [
  { icon: "📅", text: "Book appointments in minutes" },
  { icon: "🤖", text: "AI-powered pre-visit summaries" },
  { icon: "💊", text: "Digital prescriptions & reminders" },
  { icon: "📧", text: "Automated email notifications" },
];

export default function Login() {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPwd, setShowPwd] = useState(false);

  if (isAuthenticated) {
    navigate(`/${user.role}`, { replace: true });
    return null;
  }

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const loggedInUser = await login(form.email, form.password);
      toast.success(`Welcome back, ${loggedInUser.name}!`);
      navigate(`/${loggedInUser.role}`, { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 flex-col justify-between p-12 relative overflow-hidden">
        {/* Decorative circles */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
        <div className="absolute top-1/2 left-1/2 w-96 h-96 bg-white/3 rounded-full -translate-x-1/2 -translate-y-1/2" />

        {/* Brand */}
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center">
              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="text-white font-bold text-xl">HealthCare</span>
          </div>
          <p className="text-teal-200 text-sm">Appointment & Follow-up Manager</p>
        </div>

        {/* Hero text */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Your health,<br />our priority.
          </h2>
          <p className="text-teal-100 text-base mb-10 leading-relaxed">
            A complete platform connecting patients with doctors — seamlessly, securely, and with care.
          </p>
          <ul className="space-y-4">
            {features.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg shrink-0">
                  {icon}
                </div>
                <span className="text-teal-100 text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <p className="relative text-teal-300 text-xs">© 2025 HealthCare. All rights reserved.</p>
      </div>

      {/* Right panel — form */}
      <div className="flex-1 flex items-center justify-center bg-gradient-to-br from-slate-50 via-teal-50/40 to-cyan-50/30 px-6 py-12">
        <div className="w-full max-w-md animate-fadeIn">
          {/* Mobile brand */}
          <div className="flex items-center gap-2 mb-8 lg:hidden">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
              </svg>
            </div>
            <span className="font-bold text-gray-800">HealthCare</span>
          </div>

          <div className="bg-white rounded-3xl shadow-xl border border-teal-100 p-8">
            <div className="mb-7">
              <h1 className="text-2xl font-bold text-gray-800">Welcome back 👋</h1>
              <p className="text-sm text-gray-400 mt-1">Sign in to your account to continue</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex gap-2 items-start">
                <span className="text-red-400 mt-0.5">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <input
                  type="email" name="email" value={form.email}
                  onChange={handleChange} required autoComplete="email"
                  placeholder="you@example.com"
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <input
                    type={showPwd ? "text" : "password"} name="password" value={form.password}
                    onChange={handleChange} required autoComplete="current-password"
                    placeholder="••••••••"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                  />
                  <button type="button" onClick={() => setShowPwd(v => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium select-none">
                    {showPwd ? "Hide" : "Show"}
                  </button>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-60 text-white font-semibold py-3 text-sm transition-all duration-150 shadow-md shadow-teal-200 hover:shadow-lg hover:-translate-y-0.5 mt-2"
              >
                {loading ? "Signing in…" : "Sign in →"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400">
                Don't have an account?{" "}
                <Link to="/register" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline">
                  Create one
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Doctors & admins — use credentials provided by your administrator
          </p>
        </div>
      </div>
    </div>
  );
}
