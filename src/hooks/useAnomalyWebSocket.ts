
import { useState, useEffect } from "react";
import useWebSocket from "./useWebSocket";

export interface Anomaly {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: string;
  msg: string;
  anomaly_score: number;
}

export const useAnomalyWebSocket = (maxAnomalies: number = 20) => {
  const [anomalies, setAnomalies] = useState<Anomaly[]>([]);
  const { lastMessage } = useWebSocket("/api/ws/anomalies");

  useEffect(() => {
    if (lastMessage) {
      try {
        const newAnomaly = JSON.parse(lastMessage);
        setAnomalies(prev => [newAnomaly, ...prev.slice(0, maxAnomalies - 1)]);
      } catch (error) {
        console.error("Failed to parse anomaly message:", error);
      }
    }
  }, [lastMessage, maxAnomalies]);

  return {
    anomalies,
    clearAnomalies: () => setAnomalies([])
  };
};
