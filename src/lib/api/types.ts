
// Common types used across the API

export interface ApiOptions {
  method?: string;
  body?: object;
  token?: string | null;
}

// Authentication types
export interface LoginResponse {
  token: string;
  role: string;
}

// Log search types
export interface SearchLogsParams {
  start_date?: string;
  end_date?: string;
  host?: string;
  app?: string;
  severity?: string;
  message?: string;
  use_regex?: boolean;
}

// Alert types
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

export interface NewAlert {
  name: string;
  description: string;
  severity: string;
  query: string;
  is_active: boolean;
}

// AI types
export interface AIQuery {
  query: string;
}

export interface NLQueryResponse {
  results: Array<{
    id: string;
    ts: string;
    host: string;
    app: string;
    severity: string;
    msg: string;
  }>;
}

export interface AnomalyExplanationResponse {
  explanation: string;
  anomaly: any;
  similar_anomalies: any[];
  stats: any;
}

export interface Anomaly {
  id: string;
  ts: string;
  host: string;
  app: string;
  severity: string;
  msg: string;
  anomaly_score: number;
}

export interface ForecastResponse {
  forecast: Array<{
    date: string;
    predicted_count: number;
    lower_bound: number;
    upper_bound: number;
  }>;
  historical: Array<{
    date: string;
    count: number;
  }>;
}

export interface PatternExplanationResponse {
  pattern: string;
  explanation: string;
  related_patterns?: string[];
  possible_causes?: string[];
  recommendations?: string[];
}
