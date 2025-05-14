import { toast } from "sonner";

interface ApiOptions {
  method?: string;
  body?: object;
  token?: string | null;
}

export const API_URL = import.meta.env.VITE_API_URL || window.location.origin;

export const fetchApi = async <T>(endpoint: string, options: ApiOptions = {}): Promise<T> => {
  const { method = "GET", body, token = localStorage.getItem("access_token") } = options;
  
  try {
    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    
    if (token) {
      headers["Authorization"] = `Bearer ${token}`;
    }
    
    const response = await fetch(`${API_URL}${endpoint}`, {
      method,
      headers,
      body: body ? JSON.stringify(body) : undefined,
    });
    
    if (!response.ok) {
      // Try to get error message from response
      let errorMessage = `Request failed with status: ${response.status}`;
      try {
        const errorData = await response.json();
        errorMessage = errorData.detail || errorData.message || errorMessage;
      } catch (e) {
        // Ignore parsing errors
      }
      
      throw new Error(errorMessage);
    }
    
    const data = await response.json();
    return data as T;
  } catch (error) {
    console.error(`API Error (${endpoint}):`, error);
    
    // Show toast notification for non-401 errors
    if (error instanceof Error && !error.message.includes("401")) {
      toast.error("API Error", {
        description: error.message || "An unknown error occurred",
      });
    }
    
    throw error;
  }
};

export const login = async (username: string, password: string) => {
  try {
    // Using URLSearchParams for form data (required by FastAPI)
    const formData = new URLSearchParams();
    formData.append("username", username);
    formData.append("password", password);
    
    const response = await fetch(`${API_URL}/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.detail || "Login failed");
    }
    
    const data = await response.json();
    localStorage.setItem("access_token", data.access_token);
    
    return {
      token: data.access_token,
      role: data.role,
    };
  } catch (error) {
    console.error("Login error:", error);
    toast.error("Login Failed", {
      description: error instanceof Error ? error.message : "Invalid credentials",
    });
    throw error;
  }
};

export const logout = () => {
  localStorage.removeItem("access_token");
};

export const getCurrentUser = async () => {
  return fetchApi("/users/me");
};

export const getLogStats = async () => {
  return fetchApi("/logs/stats");
};

export interface SearchLogsParams {
  start_date?: string;
  end_date?: string;
  host?: string;
  app?: string;
  severity?: string;
  message?: string;
  use_regex?: boolean;
}

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

// Alert API functions
export interface Alert {
  id: number;
  name: string;
  description: string;
  severity: string;
  query: string;
  is_active: boolean;
  created_at: string;
  last_triggered?: string;
}

export const getAlerts = async (): Promise<Alert[]> => {
  return fetchApi<Alert[]>("/alerts");
};

export interface NewAlert {
  name: string;
  description: string;
  severity: string;
  query: string;
  is_active: boolean;
}

export const createAlert = async (alert: NewAlert): Promise<Alert> => {
  return fetchApi<Alert>("/alerts", {
    method: "POST",
    body: alert,
  });
};

export const updateAlert = async (id: number, data: Partial<NewAlert>): Promise<Alert> => {
  return fetchApi<Alert>(`/alerts/${id}`, {
    method: "PATCH",
    body: data,
  });
};

export const deleteAlert = async (id: number): Promise<void> => {
  return fetchApi<void>(`/alerts/${id}`, {
    method: "DELETE",
  });
};

// AI API functions
export interface AIQuery {
  query: string;
}

export const nlQueryLogs = async (query: string) => {
  return fetchApi('/ai/natural_language_query', {
    method: 'POST',
    body: { query }
  });
};

export const getLogForecast = async () => {
  return fetchApi('/ai/forecast');
};

export interface AnomalyExplanationResponse {
  explanation: string;
  anomaly: any;
  similar_anomalies: any[];
  stats: any;
}

export const getAnomalyExplanation = async (anomalyId: string): Promise<AnomalyExplanationResponse> => {
  return fetchApi<AnomalyExplanationResponse>(`/anomalies/explain/${anomalyId}`);
};

export const getPatternExplanation = async (patternId: string) => {
  return fetchApi(`/ai/explain_pattern/${patternId}`);
};

// Get recent anomalies
export interface Anomaly {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: string;
  msg: string;
  anomaly_score: number;
}

export const getRecentAnomalies = async (limit = 10): Promise<Anomaly[]> => {
  return fetchApi<Anomaly[]>(`/anomalies/recent?limit=${limit}`);
};
