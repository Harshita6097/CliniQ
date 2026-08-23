import axiosInstance from "./axiosInstance";

// ─── Doctors ──────────────────────────────────────────────────────────────────
export const adminGetAllDoctors  = ()         =>
  axiosInstance.get("/admin/doctors").then(r => r.data.doctors);

export const adminCreateDoctor   = (data)     =>
  axiosInstance.post("/admin/doctors", data).then(r => r.data);

export const adminUpdateDoctor   = (id, data) =>
  axiosInstance.patch(`/admin/doctors/${id}`, data).then(r => r.data);

export const adminDeactivateDoctor = (id)     =>
  axiosInstance.delete(`/admin/doctors/${id}`).then(r => r.data);

export const adminReactivateDoctor = (id)     =>
  axiosInstance.patch(`/admin/doctors/${id}/reactivate`).then(r => r.data);

export const adminMarkLeave      = (id, dates) =>
  axiosInstance.post(`/admin/doctors/${id}/leave`, { dates }).then(r => r.data);

// ─── Appointments ─────────────────────────────────────────────────────────────
export const adminGetAllAppointments = (params) =>
  axiosInstance.get("/admin/appointments", { params }).then(r => r.data);

// ─── Notifications ────────────────────────────────────────────────────────────
export const adminGetNotifications = (status) =>
  axiosInstance.get("/admin/notifications", { params: status ? { status } : {} }).then(r => r.data);

// ─── Users ────────────────────────────────────────────────────────────────────
export const adminGetAllUsers    = (role)     =>
  axiosInstance.get("/admin/users", { params: role ? { role } : {} }).then(r => r.data);

export const adminToggleUser     = (id)       =>
  axiosInstance.patch(`/admin/users/${id}/toggle-active`).then(r => r.data);
