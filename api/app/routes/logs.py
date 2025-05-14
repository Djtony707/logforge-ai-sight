from fastapi import Depends, WebSocket, WebSocketDisconnect
from typing import Annotated, Dict, List
import asyncio
import asyncpg
import json
import os
import re
from collections import Counter

from .. import app, db_pool
from ..models import LogSearch
from ..auth import get_current_active_user

@app.post("/logs/search")
async def search_logs(
    search: LogSearch,
    current_user: Annotated[dict, Depends(get_current_active_user)]
):
    query = "SELECT id, ts, host, app, severity, msg, is_anomaly, anomaly_score FROM logs WHERE 1=1"
    params = []
    param_idx = 1
    
    if search.start_date:
        query += f" AND ts >= ${param_idx}"
        params.append(search.start_date)
        param_idx += 1
        
    if search.end_date:
        query += f" AND ts <= ${param_idx}"
        params.append(search.end_date)
        param_idx += 1
        
    if search.host:
        query += f" AND host = ${param_idx}"
        params.append(search.host)
        param_idx += 1
        
    if search.app:
        query += f" AND app = ${param_idx}"
        params.append(search.app)
        param_idx += 1
        
    if search.severity:
        query += f" AND severity = ${param_idx}"
        params.append(search.severity)
        param_idx += 1
        
    if search.message:
        if search.use_regex:
            query += f" AND msg ~ ${param_idx}"
            params.append(search.message)
        else:
            query += f" AND msg ILIKE ${param_idx}"
            params.append(f"%{search.message}%")
        param_idx += 1
    
    query += " ORDER BY ts DESC LIMIT 1000"
    
    async with db_pool.acquire() as conn:
        rows = await conn.fetch(query, *params)
        results = [dict(row) for row in rows]
    
    return results

@app.get("/logs/stats")
async def get_log_stats(current_user: Annotated[dict, Depends(get_current_active_user)]):
    async with db_pool.acquire() as conn:
        total_count = await conn.fetchval("SELECT COUNT(*) FROM logs")
        
        hosts = await conn.fetch("SELECT host, COUNT(*) as count FROM logs GROUP BY host ORDER BY count DESC LIMIT 10")
        
        apps = await conn.fetch("SELECT app, COUNT(*) as count FROM logs GROUP BY app ORDER BY count DESC LIMIT 10")
        
        severity_counts = await conn.fetch(
            "SELECT severity, COUNT(*) as count FROM logs GROUP BY severity ORDER BY CASE severity " +
            "WHEN 'emergency' THEN 0 WHEN 'alert' THEN 1 WHEN 'critical' THEN 2 " +
            "WHEN 'error' THEN 3 WHEN 'warning' THEN 4 WHEN 'notice' THEN 5 " + 
            "WHEN 'info' THEN 6 WHEN 'debug' THEN 7 ELSE 8 END"
        )
        
        anomaly_count = await conn.fetchval("SELECT COUNT(*) FROM logs WHERE is_anomaly = TRUE")
        
    return {
        "total_logs": total_count,
        "hosts": [dict(h) for h in hosts],
        "applications": [dict(a) for a in apps],
        "severity_distribution": [dict(s) for s in severity_counts],
        "anomaly_count": anomaly_count
    }

@app.get("/logs/anomalies")
async def get_recent_anomalies(current_user: Annotated[dict, Depends(get_current_active_user)]):
    """Get the most recent anomalies for analysis."""
    async with db_pool.acquire() as conn:
        anomalies = await conn.fetch(
            "SELECT id, ts, host, app, severity, msg, anomaly_score "
            "FROM logs WHERE is_anomaly = TRUE ORDER BY ts DESC LIMIT 20"
        )
        return [dict(a) for a in anomalies]

@app.get("/logs/forecast")
async def get_log_forecast(current_user: Annotated[dict, Depends(get_current_active_user)]):
    """Get the forecast data for log volume."""
    async with db_pool.acquire() as conn:
        forecast_data = await conn.fetch(
            "SELECT ts as date, value as predicted, lower_bound as lower, upper_bound as upper "
            "FROM forecasts WHERE metric = 'log_volume' ORDER BY ts ASC LIMIT 7"
        )
        return [dict(f) for f in forecast_data]

@app.get("/logs/patterns")
async def get_log_patterns(current_user: Annotated[dict, Depends(get_current_active_user)], limit: int = 10):
    """Get the most common log message patterns."""
    async with db_pool.acquire() as conn:
        # Get recent logs for pattern analysis
        logs = await conn.fetch(
            "SELECT msg FROM logs ORDER BY ts DESC LIMIT 1000"
        )
        
        # Extract patterns from logs
        patterns = []
        pattern_counts = Counter()
        
        for log in logs:
            # Replace specific values with placeholders
            # IPs, timestamps, numbers, hexadecimal values, UUIDs
            msg = log['msg']
            
            # Replace common variable patterns
            pattern = re.sub(r'\b(?:\d{1,3}\.){3}\d{1,3}\b', '<IP_ADDRESS>', msg)
            pattern = re.sub(r'\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b', '<UUID>', pattern, flags=re.IGNORECASE)
            pattern = re.sub(r'\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?\b', '<TIMESTAMP>', pattern)
            pattern = re.sub(r'\b0x[0-9a-f]+\b', '<HEX_VALUE>', pattern, flags=re.IGNORECASE)
            pattern = re.sub(r'\b\d+\b', '<NUMBER>', pattern)
            
            pattern_counts[pattern] += 1
        
        # Get the most common patterns
        most_common_patterns = [
            {"pattern": pattern, "count": count, "examples": []}
            for pattern, count in pattern_counts.most_common(limit)
        ]
        
        # Find examples for each pattern
        for pattern_info in most_common_patterns:
            pattern_regex = pattern_info["pattern"]
            
            # Convert the pattern back to a regex pattern for matching examples
            search_pattern = pattern_regex
            search_pattern = search_pattern.replace('<IP_ADDRESS>', r'(?:\d{1,3}\.){3}\d{1,3}')
            search_pattern = search_pattern.replace('<UUID>', r'[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}')
            search_pattern = search_pattern.replace('<TIMESTAMP>', r'\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(?:\.\d+)?(?:Z|[+-]\d{2}:\d{2})?')
            search_pattern = search_pattern.replace('<HEX_VALUE>', r'0x[0-9a-f]+')
            search_pattern = search_pattern.replace('<NUMBER>', r'\d+')
            
            # Escape any special regex characters in the original text
            search_pattern = "^" + re.escape(search_pattern).replace("\<", "<").replace("\>", ">") + "$"
            
            # Find examples for this pattern
            examples = await conn.fetch(
                "SELECT id, ts, host, app, severity, msg FROM logs WHERE msg ~ $1 ORDER BY ts DESC LIMIT 3",
                search_pattern
            )
            
            pattern_info["examples"] = [dict(example) for example in examples]
        
        return most_common_patterns

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        if client_id not in self.active_connections:
            self.active_connections[client_id] = []
        self.active_connections[client_id].append(websocket)

    def disconnect(self, websocket: WebSocket, client_id: str):
        if client_id in self.active_connections:
            self.active_connections[client_id].remove(websocket)
            if not self.active_connections[client_id]:
                del self.active_connections[client_id]

    async def send_personal_message(self, message: str, websocket: WebSocket):
        await websocket.send_text(message)

    async def broadcast(self, message: str, client_id: str):
        if client_id in self.active_connections:
            for connection in self.active_connections[client_id]:
                await connection.send_text(message)

manager = ConnectionManager()
anomaly_manager = ConnectionManager()

# Start listening for PostgreSQL NOTIFY events
async def listen_for_notifications(client_id: str, channel: str, connection_manager):
    conn = await asyncpg.connect(
        host=os.environ.get("DB_HOST", "db"),
        port=int(os.environ.get("DB_PORT", "5432")),
        user=os.environ.get("DB_USER", "logforge"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME", "logforge_db")
    )
    
    await conn.add_listener(channel, lambda _, msg: asyncio.create_task(
        connection_manager.broadcast(msg, client_id)
    ))
    
    try:
        # Keep the connection open to receive notifications
        while client_id in connection_manager.active_connections:
            await asyncio.sleep(1)
    finally:
        await conn.close()

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket, client_id: str = None):
    if client_id is None:
        client_id = f"client_{id(websocket)}"
        
    await manager.connect(websocket, client_id)
    
    # Start PostgreSQL NOTIFY listener in background
    listener_task = asyncio.create_task(listen_for_notifications(client_id, 'new_log', manager))
    
    try:
        while True:
            # Just keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
        listener_task.cancel()

@app.websocket("/ws/anomalies")
async def anomalies_websocket(websocket: WebSocket, client_id: str = None):
    """WebSocket endpoint for real-time anomaly notifications."""
    if client_id is None:
        client_id = f"anomaly_client_{id(websocket)}"
        
    await anomaly_manager.connect(websocket, client_id)
    
    # Start PostgreSQL NOTIFY listener for anomalies in background
    listener_task = asyncio.create_task(listen_for_notifications(client_id, 'new_anomaly', anomaly_manager))
    
    try:
        while True:
            # Keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        anomaly_manager.disconnect(websocket, client_id)
        listener_task.cancel()
