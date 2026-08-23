import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { getMyAppointments, cancelAppointment } from "../api/appointment.api";
import toast from "react-hot-toast";

export const useAppointments = (status) => {
  return useQuery({
    queryKey: ["appointments", status],
    queryFn:  () => getMyAppointments(status),
  });
};

export const useCancelAppointment = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, reason }) => cancelAppointment(id, reason),
    onSuccess: (_data, { id }) => {
      queryClient.invalidateQueries({ queryKey: ["appointments"] });
      queryClient.invalidateQueries({ queryKey: ["appointment", id] });
      toast.success("Appointment cancelled.");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Cancellation failed."),
  });
};
