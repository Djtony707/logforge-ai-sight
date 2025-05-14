
import { fetchApi } from "./core";
import { NLQueryResponse, AnomalyExplanationResponse, Anomaly, ForecastResponse, PatternExplanationResponse } from "./types";

export const nlQueryLogs = async (query: string): Promise<NLQueryResponse> => {
  return fetchApi<NLQueryResponse>('/ai/natural_language_query', {
    method: 'POST',
    body: { query }
  });
};

export const getLogForecast = async (): Promise<ForecastResponse> => {
  return fetchApi<ForecastResponse>('/ai/forecast');
};

export const getAnomalyExplanation = async (anomalyId: string): Promise<AnomalyExplanationResponse> => {
  return fetchApi<AnomalyExplanationResponse>(`/anomalies/explain/${anomalyId}`);
};

export const getPatternExplanation = async (patternId: string): Promise<PatternExplanationResponse> => {
  return fetchApi<PatternExplanationResponse>(`/ai/explain_pattern/${patternId}`);
};

export const getRecentAnomalies = async (limit = 10): Promise<Anomaly[]> => {
  return fetchApi<Anomaly[]>(`/anomalies/recent?limit=${limit}`);
};
