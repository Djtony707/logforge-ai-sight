
import { useState, useEffect, useCallback, useRef } from "react";

interface UseWebSocketOptions {
  reconnectAttempts?: number;
  reconnectInterval?: number;
  onOpen?: () => void;
  onClose?: () => void;
  onError?: (event: Event) => void;
}

const useWebSocket = (url: string, options: UseWebSocketOptions = {}) => {
  const [isConnected, setIsConnected] = useState(false);
  const [lastMessage, setLastMessage] = useState<string | null>(null);
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectAttemptsRef = useRef(0);
  const maxReconnectAttempts = options.reconnectAttempts || 10;
  const reconnectInterval = options.reconnectInterval || 3000;

  const connect = useCallback(() => {
    if (!url) return;

    // For development without a real backend
    const isDevelopment = process.env.NODE_ENV === "development";
    if (isDevelopment) {
      console.log(`[WebSocket] Development mode: Simulating connection to ${url}`);
      setIsConnected(true);
      
      // Set up a mock message sender for development
      const mockMessageInterval = setInterval(() => {
        const mockData = {
          id: Math.random().toString(36).substring(2, 9),
          ts: new Date().toISOString(),
          host: ["server1", "db-primary", "web-frontend"][Math.floor(Math.random() * 3)] + ".example.com",
          app: ["nginx", "postgres", "app-server"][Math.floor(Math.random() * 3)],
          severity: ["info", "warning", "error", "critical"][Math.floor(Math.random() * 4)],
          msg: [
            "Connection established",
            "CPU usage at 85%",
            "Failed login attempt",
            "Disk space warning",
            "Service restarted"
          ][Math.floor(Math.random() * 5)],
          isAnomaly: Math.random() > 0.9,
          anomalyScore: Math.random()
        };
        
        setLastMessage(JSON.stringify(mockData));
      }, 3000);
      
      return () => clearInterval(mockMessageInterval);
    }

    try {
      const ws = new WebSocket(url.startsWith("ws") ? url : `ws://${window.location.host}${url}`);
      
      ws.onopen = () => {
        console.log(`[WebSocket] Connected to ${url}`);
        setIsConnected(true);
        reconnectAttemptsRef.current = 0;
        if (options.onOpen) options.onOpen();
      };
      
      ws.onmessage = (event) => {
        setLastMessage(event.data);
      };
      
      ws.onclose = (event) => {
        console.log(`[WebSocket] Disconnected from ${url}`, event.reason);
        setIsConnected(false);
        
        if (options.onClose) options.onClose();
        
        // Attempt to reconnect
        if (reconnectAttemptsRef.current < maxReconnectAttempts) {
          reconnectAttemptsRef.current += 1;
          console.log(`[WebSocket] Attempting to reconnect (${reconnectAttemptsRef.current}/${maxReconnectAttempts})...`);
          setTimeout(connect, reconnectInterval);
        } else {
          console.log(`[WebSocket] Maximum reconnection attempts reached (${maxReconnectAttempts})`);
        }
      };
      
      ws.onerror = (event) => {
        console.error("[WebSocket] Error:", event);
        if (options.onError) options.onError(event);
      };
      
      wsRef.current = ws;
      
      return () => {
        ws.close();
      };
    } catch (error) {
      console.error("[WebSocket] Connection error:", error);
    }
  }, [url, options, maxReconnectAttempts, reconnectInterval]);

  useEffect(() => {
    const cleanup = connect();
    return () => {
      if (cleanup) cleanup();
      if (wsRef.current) {
        wsRef.current.close();
        wsRef.current = null;
      }
    };
  }, [connect]);

  const sendMessage = useCallback((data: string | object) => {
    if (!wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) {
      console.error("[WebSocket] Connection not open");
      return false;
    }
    
    try {
      const message = typeof data === "string" ? data : JSON.stringify(data);
      wsRef.current.send(message);
      return true;
    } catch (error) {
      console.error("[WebSocket] Failed to send message:", error);
      return false;
    }
  }, []);

  return {
    isConnected,
    lastMessage,
    sendMessage,
    reconnect: connect
  };
};

export default useWebSocket;
