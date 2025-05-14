
import { fetchApi } from "./core";
import { SearchLogsParams } from "./types";
import { API_URL } from "./core";

export const getLogStats = async () => {
  return fetchApi("/logs/stats");
};

export const searchLogs = async (params: SearchLogsParams) => {
  return fetchApi("/logs/search", {
    method: "POST",
    body: params,
  });
};

// Export logs function
export const exportLogs = async (params: SearchLogsParams, format: "csv" | "json") => {
  const response = await fetch(`${API_URL}/logs/export?format=${format}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${localStorage.getItem("access_token")}`,
    },
    body: JSON.stringify(params),
  });
  
  if (!response.ok) {
    let errorMessage = `Export failed with status: ${response.status}`;
    try {
      const errorData = await response.json();
      errorMessage = errorData.detail || errorData.message || errorMessage;
    } catch (e) {
      // Ignore parsing errors
    }
    
    throw new Error(errorMessage);
  }
  
  const blob = await response.blob();
  const filename = response.headers.get('Content-Disposition')?.split('filename=')[1]?.replace(/"/g, '') || 
    `logforge_export_${new Date().toISOString().split('T')[0]}.${format}`;
  
  return { blob, filename };
};

// Get log patterns
export const getLogPatterns = async () => {
  return fetchApi("/logs/patterns");
};
