
-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS timescaledb CASCADE;
CREATE EXTENSION IF NOT EXISTS vector;

-- Create users table
CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL DEFAULT 'viewer',
    email VARCHAR(255) UNIQUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    last_login TIMESTAMPTZ
);

-- Create logs table
CREATE TABLE IF NOT EXISTS logs (
    id UUID PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    host VARCHAR(255) NOT NULL,
    app VARCHAR(255) NOT NULL,
    severity VARCHAR(50) NOT NULL CHECK (severity IN ('emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'info', 'debug')),
    msg TEXT NOT NULL,
    is_anomaly BOOLEAN DEFAULT FALSE,
    anomaly_score FLOAT,
    vector_embedding vector(384)
);

-- Convert logs table to hypertable (time series)
SELECT create_hypertable('logs', 'ts', if_not_exists => TRUE);

-- Create index for searching
CREATE INDEX IF NOT EXISTS idx_logs_host ON logs(host);
CREATE INDEX IF NOT EXISTS idx_logs_app ON logs(app);
CREATE INDEX IF NOT EXISTS idx_logs_severity ON logs(severity);
CREATE INDEX IF NOT EXISTS idx_logs_ts ON logs(ts DESC);
CREATE INDEX IF NOT EXISTS idx_logs_anomaly ON logs(is_anomaly);

-- Create alerts table
CREATE TABLE IF NOT EXISTS alerts (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    severity VARCHAR(50) NOT NULL,
    query TEXT NOT NULL,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    created_by INTEGER REFERENCES users(id),
    last_triggered TIMESTAMPTZ
);

-- Create alert_history table
CREATE TABLE IF NOT EXISTS alert_history (
    id SERIAL PRIMARY KEY,
    alert_id INTEGER NOT NULL REFERENCES alerts(id),
    triggered_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    log_ids UUID[] NOT NULL,
    is_resolved BOOLEAN DEFAULT FALSE,
    resolved_at TIMESTAMPTZ
);

-- Create forecasts table for saving Prophet forecasts
CREATE TABLE IF NOT EXISTS forecasts (
    id SERIAL PRIMARY KEY,
    ts TIMESTAMPTZ NOT NULL,
    metric VARCHAR(255) NOT NULL,
    value FLOAT NOT NULL,
    lower_bound FLOAT,
    upper_bound FLOAT,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Create summary table for AI-generated log summaries
CREATE TABLE IF NOT EXISTS summaries (
    id SERIAL PRIMARY KEY,
    start_ts TIMESTAMPTZ NOT NULL,
    end_ts TIMESTAMPTZ NOT NULL,
    host VARCHAR(255),
    app VARCHAR(255),
    summary TEXT NOT NULL,
    created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- Insert default admin and viewer users
INSERT INTO users (username, password_hash, role)
VALUES 
    ('admin', '$2b$10$SqzqZ3TRQQUNtqNQg9OcmOVKcvKczgnHl9KO5fMXUqREBGWQmLM8y', 'admin'), -- password: admin
    ('viewer', '$2b$10$mXBigpuGq/QhQRQCUzWQ9OZyDYT2YZiFhWnp1K5v0hFmLJql8WVE2', 'viewer'); -- password: viewer
