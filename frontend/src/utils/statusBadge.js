const STATUS_CONFIG = {
  held:      { label: "Held",      classes: "bg-yellow-100 text-yellow-800" },
  confirmed: { label: "Confirmed", classes: "bg-blue-100 text-blue-800"   },
  completed: { label: "Completed", classes: "bg-green-100 text-green-800" },
  cancelled: { label: "Cancelled", classes: "bg-red-100 text-red-800"     },
};

export const getStatusConfig = (status) =>
  STATUS_CONFIG[status] ?? { label: status, classes: "bg-gray-100 text-gray-800" };

// Ready-to-use badge component string (use as JSX via StatusBadge component in Task 13+)
export const statusClasses = (status) => getStatusConfig(status).classes;
export const statusLabel   = (status) => getStatusConfig(status).label;
