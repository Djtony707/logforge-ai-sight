
import { fetchApi } from "./core";
import { Alert, NewAlert } from "./types";

export const getAlerts = async (): Promise<Alert[]> => {
  return fetchApi<Alert[]>("/alerts");
};

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
