
# Performance Tuning Guide for LogForge AI

This guide provides recommendations for optimizing LogForge AI performance for different deployment scenarios.

## Table of Contents

- [Database Optimization](#database-optimization)
- [Ingest Service Tuning](#ingest-service-tuning)
- [API Service Configuration](#api-service-configuration)
- [UI Performance](#ui-performance)
- [AI Services Resource Allocation](#ai-services-resource-allocation)
- [Benchmarking](#benchmarking)

## Database Optimization

TimescaleDB is the backbone of LogForge AI's storage system. Here are key optimizations:

### Chunk Time Interval

For high log volume environments, adjust the chunk time interval:

```sql
-- For systems with >1M logs per day, set to 1 day chunks
SELECT set_chunk_time_interval('logs', INTERVAL '1 day');

-- For systems with <100K logs per day, set to 7 day chunks
SELECT set_chunk_time_interval('logs', INTERVAL '7 days');
```

### Memory Configuration

Edit the `docker-compose.yml` file to adjust PostgreSQL memory parameters:

```yaml
db:
  environment:
    - POSTGRES_USER=${DB_USER}
    - POSTGRES_PASSWORD=${DB_PASSWORD}
    - POSTGRES_DB=${DB_NAME}
    # Memory parameters
    - shared_buffers=2GB               # 25% of available memory
    - work_mem=64MB                    # For complex queries
    - maintenance_work_mem=256MB       # For maintenance operations
    - effective_cache_size=6GB         # 75% of available memory
    - random_page_cost=1.1             # For SSD storage
```

### Indexing Strategy

LogForge AI creates indexes on frequently queried columns by default. For specific query patterns, consider adding custom indexes:

```sql
-- Example: If you frequently filter by specific hosts
CREATE INDEX idx_logs_host ON logs (host);

-- Example: If you frequently search by message content
CREATE INDEX idx_logs_msg_gin ON logs USING gin (to_tsvector('english', msg));
```

## Ingest Service Tuning

The ingest service can be optimized for higher throughput:

### Batch Processing

Update the ingest service configuration in `docker-compose.yml`:

```yaml
ingest:
  environment:
    - DB_HOST=db
    - DB_PORT=5432
    - DB_USER=${DB_USER}
    - DB_PASSWORD=${DB_PASSWORD}
    - DB_NAME=${DB_NAME}
    # Performance tuning
    - BATCH_SIZE=1000             # Increase for higher throughput
    - FLUSH_INTERVAL_MS=1000      # Decrease for lower latency
    - MAX_CONNECTIONS=10          # Postgres connection pool size
```

### UDP Buffer Size

For high-volume UDP log ingestion, increase the OS buffer size:

```bash
# Linux
sudo sysctl -w net.core.rmem_max=26214400
sudo sysctl -w net.core.rmem_default=26214400

# Add to /etc/sysctl.conf for persistence
echo "net.core.rmem_max=26214400" | sudo tee -a /etc/sysctl.conf
echo "net.core.rmem_default=26214400" | sudo tee -a /etc/sysctl.conf
```

## API Service Configuration

Optimize the FastAPI service for concurrent connections:

```yaml
api:
  environment:
    - DB_HOST=db
    - DB_PORT=5432
    - DB_USER=${DB_USER}
    - DB_PASSWORD=${DB_PASSWORD}
    - DB_NAME=${DB_NAME}
    - JWT_SECRET=${JWT_SECRET}
    - JWT_ALGORITHM=${JWT_ALGORITHM}
    - JWT_EXPIRATION=${JWT_EXPIRATION}
    # Performance tuning
    - MAX_WORKERS=4               # Set to number of CPU cores
    - DB_POOL_SIZE=20             # Database connection pool size
    - LOG_LEVEL=warning           # Reduce logging in production
```

## UI Performance

The React frontend can be optimized:

### Virtualization

LogForge AI uses virtualized lists for log displays. Configure the buffer size based on your deployment:

```typescript
// In src/components/LiveFeed.tsx and SearchResults.tsx
const VIRTUALIZATION_BUFFER = 200;  // Increase for smoother scrolling on high-end devices
```

### Query Limits

Adjust default query limits based on client capabilities:

```typescript
// In src/lib/constants.ts
export const DEFAULT_QUERY_LIMIT = 1000; // Default number of logs to fetch
export const MAX_QUERY_LIMIT = 10000;    // Maximum allowed limit
```

## AI Services Resource Allocation

Configure resources based on your hardware:

```yaml
# In docker-compose.yml
ai_anomaly:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 2G
      
ai_nl:
  deploy:
    resources:
      limits:
        cpus: '2'
        memory: 4G
        
ai_forecast:
  deploy:
    resources:
      limits:
        cpus: '1'
        memory: 2G
```

### Mistral-7B Configuration

For high-end deployments with GPU:

```yaml
ai_summary:
  deploy:
    resources:
      reservations:
        devices:
          - driver: nvidia
            count: 1
            capabilities: [gpu]
```

## Benchmarking

Use the provided load testing tool to benchmark your deployment:

```bash
# Test UDP ingestion at 1000 logs per second
node tools/load_test.js --host localhost --port 514 --count 10000 --rate 1000 --type udp

# Test TCP ingestion
node tools/load_test.js --host localhost --port 514 --count 10000 --rate 1000 --type tcp
```

## Monitoring Performance

Use Docker's built-in tools to monitor resource usage:

```bash
# Overall resource usage
docker stats

# Database stats
docker exec -it logforge-ai_db_1 psql -U postgres -c "SELECT * FROM pg_stat_activity;"

# Check TimescaleDB chunks
docker exec -it logforge-ai_db_1 psql -U postgres -c "SELECT * FROM timescaledb_information.chunks ORDER BY range_start DESC LIMIT 10;"
```

For production deployments, consider integrating with Prometheus and Grafana for comprehensive monitoring.
