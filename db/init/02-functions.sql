
-- Create function to analyze logs for anomalies
CREATE OR REPLACE FUNCTION update_anomaly_status(log_id UUID, is_anomaly BOOLEAN, score FLOAT)
RETURNS VOID AS $$
BEGIN
    UPDATE logs SET is_anomaly = is_anomaly, anomaly_score = score WHERE id = log_id;
END;
$$ LANGUAGE plpgsql;

-- Create function to generate embeddings (to be called by Python)
CREATE OR REPLACE FUNCTION update_log_embedding(log_id UUID, embedding vector)
RETURNS VOID AS $$
BEGIN
    UPDATE logs SET vector_embedding = embedding WHERE id = log_id;
END;
$$ LANGUAGE plpgsql;

-- Function to search logs by vector similarity
CREATE OR REPLACE FUNCTION search_similar_logs(query_embedding vector, similarity_threshold FLOAT, max_results INT)
RETURNS TABLE (
    id UUID,
    ts TIMESTAMPTZ,
    host VARCHAR,
    app VARCHAR,
    severity VARCHAR,
    msg TEXT,
    similarity FLOAT
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        l.id, l.ts, l.host, l.app, l.severity, l.msg, 
        1 - (l.vector_embedding <=> query_embedding) AS similarity
    FROM logs l
    WHERE l.vector_embedding IS NOT NULL
      AND 1 - (l.vector_embedding <=> query_embedding) > similarity_threshold
    ORDER BY similarity DESC
    LIMIT max_results;
END;
$$ LANGUAGE plpgsql;
