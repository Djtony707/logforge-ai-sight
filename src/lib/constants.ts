
// Severity level colors for badges
export const severityColors: Record<string, string> = {
  emergency: "bg-red-700 hover:bg-red-800",
  alert: "bg-red-600 hover:bg-red-700",
  critical: "bg-red-500 hover:bg-red-600",
  error: "bg-orange-500 hover:bg-orange-600",
  warning: "bg-yellow-500 hover:bg-yellow-600",
  notice: "bg-blue-400 hover:bg-blue-500",
  info: "bg-blue-500 hover:bg-blue-600",
  debug: "bg-gray-500 hover:bg-gray-600"
};

// Default date ranges for log searches
export const dateRanges = [
  { label: "Last 15 minutes", value: "15m" },
  { label: "Last hour", value: "1h" },
  { label: "Last 6 hours", value: "6h" },
  { label: "Last 24 hours", value: "24h" },
  { label: "Last 7 days", value: "7d" },
  { label: "Last 30 days", value: "30d" },
  { label: "Custom range", value: "custom" }
];

// Default page sizes for pagination
export const pageSizes = [
  { label: "10 per page", value: 10 },
  { label: "25 per page", value: 25 },
  { label: "50 per page", value: 50 },
  { label: "100 per page", value: 100 }
];
