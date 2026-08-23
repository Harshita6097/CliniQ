import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { changePassword } from "../api/auth.api";
import toast from "react-hot-toast";

export default function ChangePasswordModal({ onClose, accentColor = "teal" }) {
  const [form, setForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [showFields, setShowFields] = useState({ currentPassword: false, newPassword: false, confirmPassword: false });
  const toggleShow = (key) => setShowFields(f => ({ ...f, [key]: !f[key] }));

  const accent = {
    teal:   { ring: "focus:ring-teal-400",   btn: "from-teal-500 to-cyan-500 hover:from-teal-600 hover:to-cyan-600",     shadow: "shadow-teal-200" },
    indigo: { ring: "focus:ring-indigo-400", btn: "from-indigo-600 to-violet-600 hover:from-indigo-700 hover:to-violet-700", shadow: "shadow-indigo-200" },
    purple: { ring: "focus:ring-purple-400", btn: "from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700", shadow: "shadow-purple-200" },
  }[accentColor];

  const { mutate, isPending } = useMutation({
    mutationFn: () => changePassword({ currentPassword: form.currentPassword, newPassword: form.newPassword }),
    onSuccess: () => { toast.success("Password changed successfully."); onClose(); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to change password."),
  });

  const handleSubmit = (e) => {
    e.preventDefault();
    if (form.newPassword.length < 6) { toast.error("New password must be at least 6 characters."); return; }
    if (form.newPassword.length > 72) { toast.error("Password must be 72 characters or fewer."); return; }
    if (form.newPassword !== form.confirmPassword) { toast.error("Passwords do not match."); return; }
    mutate();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
      <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-sm animate-scaleIn">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-base font-bold text-gray-800">Change Password</h3>
            <p className="text-xs text-gray-400 mt-0.5">Choose a strong new password</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg">✕</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {[
            { label: "Current Password",  key: "currentPassword" },
            { label: "New Password",      key: "newPassword" },
            { label: "Confirm Password",  key: "confirmPassword" },
          ].map(({ label, key }) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
              <div className="relative">
                <input
                  type={showFields[key] ? "text" : "password"}
                  value={form[key]}
                  onChange={(e) => setForm(f => ({ ...f, [key]: e.target.value }))}
                  required
                  className={`w-full rounded-xl border border-gray-200 px-4 py-2.5 pr-12 text-sm focus:outline-none focus:ring-2 ${accent.ring} bg-gray-50 focus:bg-white transition-colors`}
                  placeholder="••••••••"
                />
                <button type="button" onClick={() => toggleShow(key)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors text-xs font-medium select-none">
                  {showFields[key] ? "Hide" : "Show"}
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={isPending}
            className={`w-full rounded-xl bg-gradient-to-r ${accent.btn} disabled:opacity-60 text-white font-semibold text-sm py-3 transition-all duration-150 shadow-md ${accent.shadow} hover:shadow-lg hover:-translate-y-0.5 mt-2`}
          >
            {isPending ? "Saving…" : "Change Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
