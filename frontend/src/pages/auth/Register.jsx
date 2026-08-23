import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";
import toast from "react-hot-toast";

const trustPoints = [
  { icon: "🔒", text: "Your data is private & secure" },
  { icon: "🩺", text: "Verified doctors only" },
  { icon: "⚡", text: "Book appointments instantly" },
  { icon: "🔔", text: "Get reminders & follow-ups" },
];

export default function Register() {
  const { register, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]       = useState({ name: "", email: "", password: "", confirmPassword: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  if (isAuthenticated) {
    navigate(`/${user.role}`, { replace: true });
    return null;
  }

  const handleChange = (e) => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) { setError("Passwords do not match."); return; }
    if (form.password.length < 6) { setError("Password must be at least 6 characters."); return; }
    if (form.password.length > 72) { setError("Password must be 72 characters or fewer."); return; }
    setLoading(true);
    try {
      const { name, email, password, phone } = form;
      const newUser = await register({ name, email, password, phone, role: "patient" });
      toast.success(`Account created! Welcome, ${newUser.name}. 🎉`);
      navigate("/patient", { replace: true });
    } catch (err) {
      setError(err.response?.data?.message || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-to-br from-teal-600 via-teal-700 to-cyan-800 flex-col justify-between p-12 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3" />
        <div className="absolute bottom-0 left-0 w-64 h-64 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />

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

        {/* Hero */}
        <div className="relative">
          <h2 className="text-4xl font-bold text-white leading-tight mb-4">
            Join thousands<br />of patients.
          </h2>
          <p className="text-teal-100 text-base mb-10 leading-relaxed">
            Create your free account and start managing your health appointments with ease.
          </p>
          <ul className="space-y-4">
            {trustPoints.map(({ icon, text }) => (
              <li key={text} className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-white/15 flex items-center justify-center text-lg shrink-0">
                  {icon}
                </div>
                <span className="text-teal-100 text-sm font-medium">{text}</span>
              </li>
            ))}
          </ul>
        </div>

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
              <h1 className="text-2xl font-bold text-gray-800">Create your account ✨</h1>
              <p className="text-sm text-gray-400 mt-1">Patient registration — free & takes 30 seconds</p>
            </div>

            {error && (
              <div className="mb-5 rounded-xl bg-red-50 border border-red-200 px-4 py-3 flex gap-2 items-start">
                <span className="text-red-400 mt-0.5">⚠️</span>
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Full name</label>
                  <input
                    type="text" name="name" value={form.name}
                    onChange={handleChange} required
                    placeholder="Jane Doe"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                  <input
                    type="email" name="email" value={form.email}
                    onChange={handleChange} required autoComplete="email"
                    placeholder="you@example.com"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">
                    Phone <span className="text-gray-400 font-normal">(optional)</span>
                  </label>
                  <input
                    type="tel" name="phone" value={form.phone}
                    onChange={handleChange}
                    placeholder="+91 98765 43210"
                    className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                  <div className="relative">
                    <input
                      type={showPwd ? "text" : "password"} name="password" value={form.password}
                      onChange={handleChange} required autoComplete="new-password"
                      placeholder="Min. 6 chars"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium select-none">
                      {showPwd ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm</label>
                  <div className="relative">
                    <input
                      type={showConfirm ? "text" : "password"} name="confirmPassword" value={form.confirmPassword}
                      onChange={handleChange} required autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full rounded-xl border border-gray-200 px-4 py-3 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-teal-400 bg-gray-50 focus:bg-white transition-colors"
                    />
                    <button type="button" onClick={() => setShowConfirm(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium select-none">
                      {showConfirm ? "Hide" : "Show"}
                    </button>
                  </div>
                </div>
              </div>

              <button
                type="submit" disabled={loading}
                className="w-full rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600 disabled:opacity-60 text-white font-semibold py-3 text-sm transition-all duration-150 shadow-md shadow-teal-200 hover:shadow-lg hover:-translate-y-0.5 mt-1"
              >
                {loading ? "Creating account…" : "Create account →"}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-gray-100 text-center">
              <p className="text-sm text-gray-400">
                Already have an account?{" "}
                <Link to="/login" className="text-teal-600 hover:text-teal-700 font-semibold hover:underline">
                  Sign in
                </Link>
              </p>
            </div>
          </div>

          <p className="text-center text-xs text-gray-400 mt-6">
            Doctors are added by admin — contact your administrator for access
          </p>
        </div>
      </div>
    </div>
  );
}
