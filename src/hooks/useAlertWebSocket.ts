
import { useState, useEffect } from "react";
import useWebSocket from "./useWebSocket";
import { Alert } from "@/lib/api";

export interface AlertNotification {
  alert_id: number;
  alert_name: string;
  severity: string;
  log_id: string;
  triggered_at: string;
}

export const useAlertWebSocket = (maxNotifications: number = 20) => {
  const [notifications, setNotifications] = useState<AlertNotification[]>([]);
  const { lastMessage, isConnected } = useWebSocket("/ws/alerts");

  useEffect(() => {
    if (lastMessage) {
      try {
        const notification = JSON.parse(lastMessage);
        setNotifications(prev => [notification, ...prev.slice(0, maxNotifications - 1)]);
      } catch (error) {
        console.error("Failed to parse alert notification:", error);
      }
    }
  }, [lastMessage, maxNotifications]);

  return {
    notifications,
    isConnected,
    clearNotifications: () => setNotifications([])
  };
};
