import { useQuery } from "@tanstack/react-query";
import { getSlots } from "../api/appointment.api";

const useSlots = (doctorId, date) => {
  return useQuery({
    queryKey:           ["slots", doctorId, date],
    queryFn:            () => getSlots(doctorId, date),
    enabled:            !!doctorId && !!date,
    staleTime:          0,
    refetchOnWindowFocus: true,
  });
};

export default useSlots;
