
import { useState, useEffect } from "react";
import useWebSocket from "./useWebSocket";

export interface LogEntry {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: "emergency" | "alert" | "critical" | "error" | "warning" | "notice" | "info" | "debug";
  msg: string;
  is_anomaly?: boolean;
  anomaly_score?: number;
}

export const useLogWebSocket = (maxLogs: number = 100) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const { lastMessage, isConnected } = useWebSocket("/ws/logs");

  useEffect(() => {
    if (lastMessage) {
      try {
        const newLog = JSON.parse(lastMessage);
        setLogs(prev => [newLog, ...prev.slice(0, maxLogs - 1)]);
      } catch (error) {
        console.error("Failed to parse log message:", error);
      }
    }
  }, [lastMessage, maxLogs]);

  return {
    logs,
    isConnected,
    clearLogs: () => setLogs([])
  };
};
