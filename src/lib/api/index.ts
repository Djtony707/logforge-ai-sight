
// Main API file that re-exports everything from our modules

// Core API utilities
export { API_URL, fetchApi } from './core';

// Authentication
export { login, logout, getCurrentUser } from './auth';

// Logs
export { getLogStats, searchLogs, exportLogs, getLogPatterns } from './logs';

// Alerts
export { getAlerts, createAlert, updateAlert, deleteAlert } from './alerts';

// AI
export { 
  nlQueryLogs, 
  getLogForecast, 
  getAnomalyExplanation, 
  getPatternExplanation, 
  getRecentAnomalies 
} from './ai';

// Type exports
export type {
  ApiOptions,
  LoginResponse,
  SearchLogsParams,
  Alert,
  NewAlert,
  AIQuery,
  NLQueryResponse,
  AnomalyExplanationResponse,
  Anomaly,
  ForecastResponse,
  PatternExplanationResponse
} from './types';
