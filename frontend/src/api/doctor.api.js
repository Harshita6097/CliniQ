import axiosInstance from "./axiosInstance";

export const getDoctorProfile      = ()         =>
  axiosInstance.get("/doctor/profile").then(r => r.data.profile);

export const getDoctorAppointments = (status)   =>
  axiosInstance.get("/doctor/appointments", { params: status ? { status } : {} }).then(r => r.data.appointments);

export const getDoctorAppointmentById = (id)    =>
  axiosInstance.get(`/doctor/appointments/${id}`).then(r => r.data);

export const submitNotes           = (id, data) =>
  axiosInstance.post(`/doctor/appointments/${id}/notes`, data).then(r => r.data);

export const markLeave             = (dates)    =>
  axiosInstance.post("/doctor/leave", { dates }).then(r => r.data);

export const removeLeave           = (dates)    =>
  axiosInstance.delete("/doctor/leave", { data: { dates } }).then(r => r.data);
