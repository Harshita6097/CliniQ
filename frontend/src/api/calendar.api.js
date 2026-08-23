import axiosInstance from "./axiosInstance";

export const getCalendarStatus     = ()  =>
  axiosInstance.get("/calendar/status").then(r => r.data);

export const getCalendarConnectUrl = ()  =>
  axiosInstance.get("/calendar/connect").then(r => r.data.url);

export const disconnectCalendar    = ()  =>
  axiosInstance.delete("/calendar/disconnect").then(r => r.data);
