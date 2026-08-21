import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";

export const formatSlot = (date) =>
  format(new Date(date), "dd MMM yyyy, hh:mm a");

export const formatDate = (date) =>
  format(new Date(date), "dd MMM yyyy");

export const formatTime = (date) =>
  format(new Date(date), "hh:mm a");

export const timeAgo = (date) =>
  formatDistanceToNow(new Date(date), { addSuffix: true });

export const slotLabel = (date) => {
  const d = new Date(date);
  if (isToday(d))    return `Today, ${formatTime(d)}`;
  if (isTomorrow(d)) return `Tomorrow, ${formatTime(d)}`;
  return formatSlot(d);
};
