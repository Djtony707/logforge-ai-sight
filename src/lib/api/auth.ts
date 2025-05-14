
import { toast } from "sonner";
import { API_URL, fetchApi } from "./core";
import { LoginResponse } from "./types";

export const login = async (username: string, password: string): Promise<LoginResponse> => {
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
