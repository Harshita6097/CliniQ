import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  adminGetAllDoctors,
  adminCreateDoctor,
  adminDeactivateDoctor,
  adminReactivateDoctor,
  adminMarkLeave,
} from "../../api/admin.api";
import { format } from "date-fns";
import toast from "react-hot-toast";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];

const emptyForm = () => ({
  name: "", email: "", password: "", phone: "",
  specialization: "", slotDurationMins: 30, consultationFee: 0,
  qualifications: "", bio: "",
  workingHours: [{ day: "Monday", start: "09:00", end: "17:00" }],
});

// Password field with show/hide toggle
const PasswordField = ({ label, name, value, onChange, required }) => {
  const [show, setShow] = useState(false);
  return (
    <div>
      <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
      <div className="relative">
        <input
          type={show ? "text" : "password"}
          value={value}
          onChange={(e) => onChange(f => ({ ...f, [name]: e.target.value }))}
          required={required}
          className="w-full rounded-xl border border-gray-200 px-3 py-2 pr-12 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 focus:bg-white transition-colors"
        />
        <button type="button" onClick={() => setShow(v => !v)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs font-medium select-none">
          {show ? "Hide" : "Show"}
        </button>
      </div>
    </div>
  );
};

export default function ManageDoctors() {
  const queryClient = useQueryClient();
  const today = format(new Date(), "yyyy-MM-dd");
  const [showCreate, setShowCreate] = useState(false);
  const [form, setForm]             = useState(emptyForm());
  const [leaveModal, setLeaveModal] = useState(null);
  const [leaveDate, setLeaveDate]   = useState("");

  const { data: doctors = [], isLoading } = useQuery({
    queryKey: ["adminDoctors"],
    queryFn:  adminGetAllDoctors,
  });

  const { mutate: createDoctor, isPending: creating } = useMutation({
    mutationFn: adminCreateDoctor,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
      setShowCreate(false); setForm(emptyForm());
      toast.success("Doctor created.");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to create doctor."),
  });

  const { mutate: deactivate } = useMutation({
    mutationFn: adminDeactivateDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminDoctors"] }); toast.success("Doctor deactivated."); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to deactivate."),
  });

  const { mutate: reactivate } = useMutation({
    mutationFn: adminReactivateDoctor,
    onSuccess: () => { queryClient.invalidateQueries({ queryKey: ["adminDoctors"] }); toast.success("Doctor reactivated."); },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to reactivate."),
  });

  const { mutate: saveLeave, isPending: savingLeave } = useMutation({
    mutationFn: ({ id, dates }) => adminMarkLeave(id, dates),
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["adminDoctors"] });
      setLeaveModal(null); setLeaveDate("");
      toast.success(`Leave saved. ${data.cancelledCount} appointment(s) cancelled.`);
    },
    onError: (err) => toast.error(err.response?.data?.message || "Failed to save leave."),
  });

  const addWH    = () => setForm(f => ({ ...f, workingHours: [...f.workingHours, { day: "Monday", start: "09:00", end: "17:00" }] }));
  const removeWH = (i) => setForm(f => ({ ...f, workingHours: f.workingHours.filter((_, idx) => idx !== i) }));
  const updateWH = (i, field, value) =>
    setForm(f => ({ ...f, workingHours: f.workingHours.map((wh, idx) => idx === i ? { ...wh, [field]: value } : wh) }));

  const handleCreate = (e) => {
    e.preventDefault();
    createDoctor({
      ...form,
      slotDurationMins: Number(form.slotDurationMins),
      consultationFee:  Number(form.consultationFee),
      qualifications:   form.qualifications || undefined,
      bio:              form.bio || undefined,
      phone:            form.phone || undefined,
    });
  };

  return (
    <div className="space-y-6 animate-fadeIn">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Manage Doctors</h1>
          <p className="text-sm text-gray-400 mt-1">Add, deactivate, and manage doctor schedules</p>
        </div>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 text-white text-sm font-semibold px-5 py-2.5 transition-all shadow-md shadow-purple-200 hover:shadow-lg hover:-translate-y-0.5"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
          </svg>
          Add Doctor
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-20">
          <div className="w-8 h-8 border-3 border-purple-500 border-t-transparent rounded-full animate-spin" />
        </div>
      ) : doctors.length === 0 ? (
        <div className="bg-white rounded-3xl border border-purple-100 shadow-md py-16 text-center">
          <div className="text-5xl mb-4">👨‍⚕️</div>
          <p className="text-sm font-semibold text-gray-500">No doctors yet</p>
          <p className="text-xs text-gray-400 mt-1">Click "Add Doctor" to get started</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {doctors.map((d) => (
            <div key={d._id} className="bg-white rounded-2xl border border-purple-100 shadow-md p-5 hover:shadow-lg hover:border-purple-200 transition-all duration-200">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-purple-100 to-fuchsia-100 flex items-center justify-center text-purple-700 font-bold text-lg shadow-sm shrink-0">
                  {d.userId?.name?.[0] ?? "D"}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-bold text-gray-800">{d.userId?.name}</p>
                    {!d.userId?.isActive && (
                      <span className="text-xs bg-red-100 text-red-600 font-semibold px-2 py-0.5 rounded-full">Inactive</span>
                    )}
                  </div>
                  <p className="text-xs text-purple-600 font-semibold mt-0.5">{d.specialization}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{d.userId?.email}</p>
                </div>
              </div>

              <div className="flex flex-wrap gap-2 mb-4">
                {d.consultationFee > 0 && (
                  <span className="text-xs bg-emerald-50 border border-emerald-200 text-emerald-700 font-semibold px-2.5 py-1 rounded-full">
                    ₹{d.consultationFee}
                  </span>
                )}
                <span className="text-xs bg-purple-50 border border-purple-200 text-purple-700 font-semibold px-2.5 py-1 rounded-full">
                  {d.slotDurationMins} min slots
                </span>
                {d.leaveDays?.length > 0 && (
                  <span className="text-xs bg-amber-50 border border-amber-200 text-amber-700 font-semibold px-2.5 py-1 rounded-full">
                    {d.leaveDays.length} leave day{d.leaveDays.length !== 1 ? "s" : ""}
                  </span>
                )}
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => setLeaveModal({ doctorId: d.userId?._id, name: d.userId?.name })}
                  className="flex-1 text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 border border-purple-200 px-3 py-2 rounded-xl transition-colors"
                >
                  Mark Leave
                </button>
                {d.userId?.isActive ? (
                  <button
                    onClick={() => { if (window.confirm(`Deactivate Dr. ${d.userId?.name}?`)) deactivate(d.userId?._id); }}
                    className="flex-1 text-xs font-semibold text-red-500 bg-red-50 hover:bg-red-100 border border-red-200 px-3 py-2 rounded-xl transition-colors"
                  >
                    Deactivate
                  </button>
                ) : (
                  <button
                    onClick={() => { if (window.confirm(`Reactivate Dr. ${d.userId?.name}?`)) reactivate(d.userId?._id); }}
                    className="flex-1 text-xs font-semibold text-emerald-600 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-2 rounded-xl transition-colors"
                  >
                    Reactivate
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Create doctor modal */}
      {showCreate && (
        <Modal title="Add New Doctor" onClose={() => { setShowCreate(false); setForm(emptyForm()); }}>
          <form onSubmit={handleCreate} className="space-y-4 max-h-[65vh] overflow-y-auto pr-1">
            <div className="grid grid-cols-2 gap-3">
              <Field label="Full Name *"           name="name"             value={form.name}             onChange={setForm} required />
              <Field label="Email *"               name="email"            value={form.email}            onChange={setForm} type="email" required />
              <PasswordField label="Password *"    name="password"         value={form.password}         onChange={setForm} required />
              <Field label="Phone"                 name="phone"            value={form.phone}            onChange={setForm} />
              <Field label="Specialization *"      name="specialization"   value={form.specialization}   onChange={setForm} required />
              <Field label="Slot Duration (mins) *" name="slotDurationMins" value={form.slotDurationMins} onChange={setForm} type="number" required />
              <Field label="Consultation Fee (₹)"  name="consultationFee"  value={form.consultationFee}  onChange={setForm} type="number" />
              <Field label="Qualifications"        name="qualifications"   value={form.qualifications}   onChange={setForm} />
            </div>
            <Field label="Bio" name="bio" value={form.bio} onChange={setForm} />

            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-sm font-semibold text-gray-700">Working Hours *</label>
                <button type="button" onClick={addWH}
                  className="text-xs font-semibold text-purple-600 bg-purple-50 hover:bg-purple-100 px-3 py-1.5 rounded-lg transition-colors">
                  + Add row
                </button>
              </div>
              <div className="space-y-2">
                {form.workingHours.map((wh, i) => (
                  <div key={i} className="flex gap-2 items-center bg-purple-50/50 rounded-xl p-2">
                    <select value={wh.day} onChange={(e) => updateWH(i, "day", e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white">
                      {DAYS.map(d => <option key={d}>{d}</option>)}
                    </select>
                    <input type="time" value={wh.start} onChange={(e) => updateWH(i, "start", e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white" />
                    <span className="text-gray-400 text-xs font-medium">to</span>
                    <input type="time" value={wh.end} onChange={(e) => updateWH(i, "end", e.target.value)}
                      className="rounded-lg border border-gray-200 px-2 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-purple-500 bg-white" />
                    {form.workingHours.length > 1 && (
                      <button type="button" onClick={() => removeWH(i)}
                        className="text-red-400 hover:text-red-600 text-sm font-bold px-1">✕</button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            <div className="flex justify-end gap-3 pt-2 border-t border-gray-100">
              <button type="button" onClick={() => { setShowCreate(false); setForm(emptyForm()); }}
                className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
                Cancel
              </button>
              <button type="submit" disabled={creating}
                className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 disabled:opacity-60 text-white rounded-xl transition-colors shadow-md">
                {creating ? "Creating…" : "Create Doctor"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Mark leave modal */}
      {leaveModal && (
        <Modal title={`Mark Leave — Dr. ${leaveModal.name}`} onClose={() => { setLeaveModal(null); setLeaveDate(""); }}>
          <p className="text-sm text-gray-500 mb-5">
            Confirmed appointments on this day will be cancelled and patients notified.
          </p>
          <input
            type="date"
            value={leaveDate}
            min={today}
            onChange={(e) => setLeaveDate(e.target.value)}
            className="rounded-xl border border-gray-200 px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 mb-5 block"
          />
          <div className="flex justify-end gap-3">
            <button onClick={() => { setLeaveModal(null); setLeaveDate(""); }}
              className="px-4 py-2.5 text-sm font-semibold text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-xl transition-colors">
              Cancel
            </button>
            <button
              onClick={() => saveLeave({ id: leaveModal.doctorId, dates: [leaveDate] })}
              disabled={!leaveDate || savingLeave}
              className="px-5 py-2.5 text-sm font-semibold bg-gradient-to-r from-purple-600 to-fuchsia-600 hover:from-purple-700 hover:to-fuchsia-700 disabled:opacity-60 text-white rounded-xl transition-colors shadow-md"
            >
              {savingLeave ? "Saving…" : "Save Leave"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

const Modal = ({ title, children, onClose }) => (
  <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 px-4">
    <div className="bg-white rounded-3xl shadow-2xl p-7 w-full max-w-lg animate-scaleIn">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-base font-bold text-gray-800">{title}</h3>
        <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-full hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors text-lg leading-none">✕</button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({ label, name, value, onChange, type = "text", required }) => (
  <div>
    <label className="block text-xs font-medium text-gray-500 mb-1">{label}</label>
    <input
      type={type}
      value={value}
      onChange={(e) => onChange(f => ({ ...f, [name]: e.target.value }))}
      required={required}
      className="w-full rounded-xl border border-gray-200 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400 bg-gray-50 focus:bg-white transition-colors"
    />
  </div>
);
