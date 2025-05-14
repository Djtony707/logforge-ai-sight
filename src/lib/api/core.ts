
import { toast } from "sonner";
import { ApiOptions } from "./types";

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
