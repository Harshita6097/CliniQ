import axiosInstance from "./axiosInstance";

export const getMe         = ()       => axiosInstance.get("/auth/me").then(r => r.data.user);
export const updateMe      = (data)   => axiosInstance.patch("/auth/me", data).then(r => r.data.user);
export const changePassword = (data)  => axiosInstance.post("/auth/change-password", data).then(r => r.data);
