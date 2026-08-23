import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

const safeDate = (date) => {
  const d = new Date(date);
  return isNaN(d.getTime()) ? null : d;
};

export const formatSlot = (date) => {
  const d = safeDate(date);
  return d ? format(d, "dd MMM yyyy, hh:mm a") : "—";
};

export const formatDate = (date) => {
  const d = safeDate(date);
  return d ? format(d, "dd MMM yyyy") : "—";
};

export const formatTime = (date) => {
  const d = safeDate(date);
  return d ? format(d, "hh:mm a") : "—";
};

export const timeAgo = (date) => {
  const d = safeDate(date);
  return d ? formatDistanceToNow(d, { addSuffix: true }) : "—";
};

export const slotLabel = (date) => {
  const d = safeDate(date);
  if (!d) return "—";
  if (isToday(d))    return `Today, ${formatTime(d)}`;
  if (isTomorrow(d)) return `Tomorrow, ${formatTime(d)}`;
  return formatSlot(d);
};
