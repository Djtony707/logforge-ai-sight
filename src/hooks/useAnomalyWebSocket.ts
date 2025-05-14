
import { useState, useEffect } from "react";
import useWebSocket from "./useWebSocket";
import { getRecentAnomalies } from "@/lib/api";

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
  const { lastMessage, isConnected } = useWebSocket("/ws/anomalies");
  
  // Load initial anomalies when component mounts
  useEffect(() => {
    const loadInitialAnomalies = async () => {
      try {
        const recentAnomalies = await getRecentAnomalies(maxAnomalies);
        if (recentAnomalies && Array.isArray(recentAnomalies) && recentAnomalies.length > 0) {
          setAnomalies(recentAnomalies as Anomaly[]);
        }
      } catch (error) {
        console.error("Failed to load initial anomalies:", error);
      }
    };
    
    loadInitialAnomalies();
  }, [maxAnomalies]);

  // Handle new anomalies from WebSocket
  useEffect(() => {
    if (lastMessage) {
      try {
        const newAnomaly = JSON.parse(lastMessage);
        // Check if anomaly already exists to avoid duplicates
        setAnomalies(prev => {
          if (prev.some(a => a.id === newAnomaly.id)) {
            return prev;
          }
          return [newAnomaly, ...prev.slice(0, maxAnomalies - 1)];
        });
      } catch (error) {
        console.error("Failed to parse anomaly message:", error);
      }
    }
  }, [lastMessage, maxAnomalies]);

  return {
    anomalies,
    isConnected,
    clearAnomalies: () => setAnomalies([])
  };
};
