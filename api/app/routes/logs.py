from fastapi import APIRouter, Depends, WebSocket, WebSocketDisconnect, HTTPException
from fastapi.responses import JSONResponse
from asyncpg.exceptions import PostgresError
import asyncio
import json
from typing import List, Dict, Optional, Any
from datetime import datetime, timedelta
from .. import app, db_pool
from ..models import LogBase, LogSearch
from ..auth import get_current_active_user, check_admin_role

# WebSocket connection manager
class ConnectionManager:
    def __init__(self):
        self.active_connections: Dict[str, List[WebSocket]] = {
            "logs": [],
            "anomalies": [],
            "alerts": []
        }
    
    async def connect(self, websocket: WebSocket, client_type: str):
        await websocket.accept()
        self.active_connections[client_type].append(websocket)
    
    def disconnect(self, websocket: WebSocket, client_type: str):
        self.active_connections[client_type].remove(websocket)
    
    async def broadcast(self, message: str, client_type: str):
        for connection in self.active_connections[client_type]:
            try:
                await connection.send_text(message)
            except Exception:
                # Handle disconnection or other errors
                pass

manager = ConnectionManager()

# WebSocket endpoints
@app.websocket("/ws/logs")
async def websocket_logs(websocket: WebSocket):
    await manager.connect(websocket, "logs")
    
    # Listen for PostgreSQL notifications via LISTEN/NOTIFY
    try:
        async with db_pool.acquire() as conn:
            await conn.add_listener('new_log', lambda conn, pid, channel, payload: asyncio.create_task(
                manager.broadcast(payload, "logs")
            ))
            
            # Keep the connection alive
            while True:
                await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "logs")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, "logs")
    finally:
        # Clean up the listener when disconnected
        async with db_pool.acquire() as conn:
            await conn.remove_listener('new_log')

@app.websocket("/ws/anomalies")
async def websocket_anomalies(websocket: WebSocket):
    await manager.connect(websocket, "anomalies")
    
    try:
        async with db_pool.acquire() as conn:
            await conn.add_listener('new_anomaly', lambda conn, pid, channel, payload: asyncio.create_task(
                manager.broadcast(payload, "anomalies")
            ))
            
            while True:
                await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "anomalies")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, "anomalies")
    finally:
        async with db_pool.acquire() as conn:
            await conn.remove_listener('new_anomaly')

@app.websocket("/ws/alerts")
async def websocket_alerts(websocket: WebSocket):
    await manager.connect(websocket, "alerts")
    
    try:
        async with db_pool.acquire() as conn:
            await conn.add_listener('new_alert', lambda conn, pid, channel, payload: asyncio.create_task(
                manager.broadcast(payload, "alerts")
            ))
            
            while True:
                await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, "alerts")
    except Exception as e:
        print(f"WebSocket error: {e}")
        manager.disconnect(websocket, "alerts")
    finally:
        async with db_pool.acquire() as conn:
            await conn.remove_listener('new_alert')

# Search logs endpoint
@app.post("/logs/search")
async def search_logs(
    search_params: LogSearch,
    current_user: dict = Depends(get_current_active_user)
):
    try:
        conditions = []
        params = []
        counter = 1
        
        if search_params.start_date:
            conditions.append(f"ts >= ${counter}")
            params.append(search_params.start_date)
            counter += 1
        
        if search_params.end_date:
            conditions.append(f"ts <= ${counter}")
            params.append(search_params.end_date)
            counter += 1
        
        if search_params.host:
            if search_params.use_regex:
                conditions.append(f"host ~* ${counter}")
            else:
                conditions.append(f"host ILIKE ${counter}")
                search_params.host = f"%{search_params.host}%"
            params.append(search_params.host)
            counter += 1
        
        if search_params.app:
            if search_params.use_regex:
                conditions.append(f"app ~* ${counter}")
            else:
                conditions.append(f"app ILIKE ${counter}")
                search_params.app = f"%{search_params.app}%"
            params.append(search_params.app)
            counter += 1
        
        if search_params.severity:
            conditions.append(f"severity = ${counter}")
            params.append(search_params.severity)
            counter += 1
        
        if search_params.message:
            if search_params.use_regex:
                conditions.append(f"msg ~* ${counter}")
            else:
                conditions.append(f"msg ILIKE ${counter}")
                search_params.message = f"%{search_params.message}%"
            params.append(search_params.message)
            counter += 1
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        query = f"""
            SELECT id, ts, host, app, severity, msg, is_anomaly, anomaly_score
            FROM logs
            WHERE {where_clause}
            ORDER BY ts DESC
            LIMIT 1000
        """
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
        result = [dict(row) for row in rows]
        return result
    
    except PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error searching logs: {str(e)}")

# Get log stats endpoint
@app.get("/logs/stats")
async def get_log_stats(current_user: dict = Depends(get_current_active_user)):
    try:
        async with db_pool.acquire() as conn:
            # Get total count
            total_count = await conn.fetchval("SELECT COUNT(*) FROM logs")
            
            # Get counts by severity
            severity_rows = await conn.fetch("""
                SELECT severity, COUNT(*) as count
                FROM logs
                GROUP BY severity
                ORDER BY count DESC
            """)
            
            # Get counts by host
            host_rows = await conn.fetch("""
                SELECT host, COUNT(*) as count
                FROM logs
                GROUP BY host
                ORDER BY count DESC
                LIMIT 10
            """)
            
            # Get counts by application
            app_rows = await conn.fetch("""
                SELECT app, COUNT(*) as count
                FROM logs
                GROUP BY app
                ORDER BY count DESC
                LIMIT 10
            """)
            
            # Get last 24 hours trend (hourly)
            trend_rows = await conn.fetch("""
                SELECT 
                    date_trunc('hour', ts) as hour,
                    COUNT(*) as count
                FROM logs
                WHERE ts >= NOW() - INTERVAL '24 hours'
                GROUP BY hour
                ORDER BY hour
            """)
            
            # Get anomaly percentage
            anomaly_count = await conn.fetchval("""
                SELECT COUNT(*) FROM logs WHERE is_anomaly = true
            """)
            
            anomaly_percentage = (anomaly_count / total_count * 100) if total_count > 0 else 0
            
        return {
            "total_count": total_count,
            "by_severity": [dict(row) for row in severity_rows],
            "by_host": [dict(row) for row in host_rows],
            "by_app": [dict(row) for row in app_rows],
            "trend": [dict(row) for row in trend_rows],
            "anomaly_count": anomaly_count,
            "anomaly_percentage": anomaly_percentage
        }
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error retrieving log stats: {str(e)}")

# Get log patterns endpoint
@app.get("/logs/patterns")
async def get_log_patterns(current_user: dict = Depends(get_current_active_user)):
    try:
        async with db_pool.acquire() as conn:
            # This is a simplified implementation
            # In a production system, this would use more sophisticated pattern detection algorithms
            patterns = await conn.fetch("""
                WITH message_groups AS (
                    SELECT 
                        REGEXP_REPLACE(msg, '[0-9]+', '#') as pattern,
                        COUNT(*) as count,
                        array_agg(id) as example_ids
                    FROM logs
                    WHERE ts >= NOW() - INTERVAL '24 hours'
                    GROUP BY pattern
                    HAVING COUNT(*) >= 5
                    ORDER BY count DESC
                    LIMIT 10
                )
                SELECT 
                    mg.pattern,
                    mg.count,
                    json_agg(
                        json_build_object(
                            'id', l.id,
                            'ts', l.ts,
                            'host', l.host,
                            'app', l.app,
                            'severity', l.severity,
                            'msg', l.msg
                        )
                    ) as examples
                FROM message_groups mg
                JOIN logs l ON l.id = ANY(mg.example_ids)
                GROUP BY mg.pattern, mg.count
                LIMIT 100
            """)
            
            return [dict(row) for row in patterns]
    
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error analyzing log patterns: {str(e)}")

# New endpoint for CSV/JSON export
@app.post("/logs/export")
async def export_logs(
    search_params: LogSearch,
    format: str = "json",
    current_user: dict = Depends(get_current_active_user)
):
    try:
        conditions = []
        params = []
        counter = 1
        
        if search_params.start_date:
            conditions.append(f"ts >= ${counter}")
            params.append(search_params.start_date)
            counter += 1
        
        if search_params.end_date:
            conditions.append(f"ts <= ${counter}")
            params.append(search_params.end_date)
            counter += 1
        
        if search_params.host:
            if search_params.use_regex:
                conditions.append(f"host ~* ${counter}")
            else:
                conditions.append(f"host ILIKE ${counter}")
                search_params.host = f"%{search_params.host}%"
            params.append(search_params.host)
            counter += 1
        
        if search_params.app:
            if search_params.use_regex:
                conditions.append(f"app ~* ${counter}")
            else:
                conditions.append(f"app ILIKE ${counter}")
                search_params.app = f"%{search_params.app}%"
            params.append(search_params.app)
            counter += 1
        
        if search_params.severity:
            conditions.append(f"severity = ${counter}")
            params.append(search_params.severity)
            counter += 1
        
        if search_params.message:
            if search_params.use_regex:
                conditions.append(f"msg ~* ${counter}")
            else:
                conditions.append(f"msg ILIKE ${counter}")
                search_params.message = f"%{search_params.message}%"
            params.append(search_params.message)
            counter += 1
        
        where_clause = " AND ".join(conditions) if conditions else "TRUE"
        
        query = f"""
            SELECT id, ts, host, app, severity, msg, is_anomaly, anomaly_score
            FROM logs
            WHERE {where_clause}
            ORDER BY ts DESC
        """
        
        async with db_pool.acquire() as conn:
            rows = await conn.fetch(query, *params)
            
        result = [dict(row) for row in rows]
        
        if format.lower() == "csv":
            # Convert to CSV format
            import csv
            from io import StringIO
            
            output = StringIO()
            if result:
                writer = csv.DictWriter(output, fieldnames=result[0].keys())
                writer.writeheader()
                writer.writerows(result)
                
            return JSONResponse(
                content={"csv_data": output.getvalue()},
                headers={
                    "Content-Disposition": f"attachment; filename=logs_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
                }
            )
        else:
            # JSON format (default)
            return JSONResponse(
                content=result,
                headers={
                    "Content-Disposition": f"attachment; filename=logs_export_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
                }
            )
    
    except PostgresError as e:
        raise HTTPException(status_code=500, detail=f"Database error: {str(e)}")
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error exporting logs: {str(e)}")
