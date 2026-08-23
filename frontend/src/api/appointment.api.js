import axiosInstance from "./axiosInstance";

export const getDoctors = (specialization) =>
  axiosInstance.get("/patient/doctors", { params: specialization ? { specialization } : {} }).then(r => r.data.doctors);

export const getSlots         = (doctorId, date) =>
  axiosInstance.get(`/patient/doctors/${doctorId}/slots`, { params: { date } }).then(r => r.data.slots);

export const holdAppointment  = (data) =>
  axiosInstance.post("/patient/appointments/hold", data).then(r => r.data);

export const confirmAppointment = (id, symptomFormText) =>
  axiosInstance.post(`/patient/appointments/${id}/confirm`, { symptomFormText }).then(r => r.data);

export const cancelAppointment = (id, reason) =>
  axiosInstance.delete(`/patient/appointments/${id}`, { data: { reason } }).then(r => r.data);

export const getMyAppointments = (status) =>
  axiosInstance.get("/patient/appointments", { params: status ? { status } : {} }).then(r => r.data.appointments);

export const getAppointmentById = (id) =>
  axiosInstance.get(`/patient/appointments/${id}`).then(r => r.data);
