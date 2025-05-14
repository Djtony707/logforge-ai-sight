
from fastapi import APIRouter, Depends, HTTPException, WebSocket
from typing import List, Dict, Any, Optional
from datetime import datetime, timedelta
import json
import asyncio

from ..models import LogBase
from ..auth import get_current_active_user, check_admin_role
from .. import db_pool
from ..routes.logs import manager

router = APIRouter()

@router.get("/anomalies/recent", response_model=List[Dict[str, Any]])
async def get_recent_anomalies(
    limit: int = 10,
    current_user: dict = Depends(get_current_active_user)
):
    """Get recent anomalies from the database"""
    try:
        async with db_pool.acquire() as conn:
            query = """
                SELECT id, ts, host, app, severity, msg, anomaly_score
                FROM logs
                WHERE is_anomaly = true
                ORDER BY ts DESC
                LIMIT $1
            """
            rows = await conn.fetch(query, limit)
            
            return [dict(row) for row in rows]
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error fetching anomalies: {str(e)}")

@router.get("/anomalies/explain/{anomaly_id}", response_model=Dict[str, Any])
async def explain_anomaly(
    anomaly_id: str,
    current_user: dict = Depends(get_current_active_user)
):
    """Get an explanation for a specific anomaly"""
    try:
        async with db_pool.acquire() as conn:
            # First check if the anomaly exists
            check_query = """
                SELECT id, ts, host, app, severity, msg, anomaly_score
                FROM logs
                WHERE id = $1 AND is_anomaly = true
            """
            anomaly = await conn.fetchrow(check_query, anomaly_id)
            
            if not anomaly:
                raise HTTPException(status_code=404, detail="Anomaly not found")
            
            # Find similar anomalies
            similar_query = """
                SELECT id, ts, host, app, severity, msg, anomaly_score
                FROM logs
                WHERE host = $1 AND app = $2 AND is_anomaly = true
                AND ts BETWEEN $3 AND $4
                AND id != $5
                ORDER BY anomaly_score DESC
                LIMIT 5
            """
            
            anomaly_dict = dict(anomaly)
            ts = anomaly_dict["ts"]
            similar_anomalies = await conn.fetch(
                similar_query,
                anomaly_dict["host"],
                anomaly_dict["app"],
                ts - timedelta(hours=24),
                ts + timedelta(hours=24),
                anomaly_id
            )
            
            # Get system stats around the anomaly time
            stats_query = """
                SELECT 
                    COUNT(*) as total_logs,
                    COUNT(*) FILTER(WHERE is_anomaly = true) as anomaly_count,
                    COUNT(DISTINCT host) as distinct_hosts,
                    COUNT(DISTINCT app) as distinct_apps
                FROM logs
                WHERE ts BETWEEN $1 AND $2
            """
            
            stats = await conn.fetchrow(
                stats_query,
                ts - timedelta(minutes=15),
                ts + timedelta(minutes=15)
            )
            
            # Generate explanation based on the data
            # In a real system, this would use a more sophisticated ML approach
            explanation = generate_anomaly_explanation(anomaly_dict, [dict(a) for a in similar_anomalies], dict(stats))
            
            return {
                "anomaly": anomaly_dict,
                "similar_anomalies": [dict(a) for a in similar_anomalies],
                "stats": dict(stats),
                "explanation": explanation
            }
            
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Error explaining anomaly: {str(e)}")

def generate_anomaly_explanation(
    anomaly: Dict[str, Any],
    similar_anomalies: List[Dict[str, Any]],
    stats: Dict[str, Any]
) -> str:
    """Generate an explanation for an anomaly based on similar anomalies and stats"""
    
    message = anomaly["msg"].lower()
    host = anomaly["host"]
    app = anomaly["app"]
    score = anomaly["anomaly_score"]
    
    explanations = []
    
    # Check for common patterns in the message
    if "cpu" in message and any(word in message for word in ["high", "usage", "load"]):
        explanations.append(f"This anomaly indicates high CPU usage on {host}.")
    
    elif "memory" in message and any(word in message for word in ["high", "usage", "allocation"]):
        explanations.append(f"This anomaly indicates high memory usage on {host}.")
        
    elif "disk" in message:
        explanations.append(f"This anomaly indicates disk space issues on {host}.")
    
    elif "database" in message or "db" in message:
        explanations.append(f"This anomaly indicates database issues in the {app} application.")
    
    elif "timeout" in message or "connection" in message:
        explanations.append(f"This anomaly indicates connection or timeout issues in the {app} application.")
    
    elif "error" in message or "exception" in message:
        explanations.append(f"This anomaly indicates an application error in {app}.")
    
    # Add information about similar anomalies
    if similar_anomalies:
        explanations.append(f"There are {len(similar_anomalies)} similar anomalies detected in the past 24 hours from the same host/application.")
    
    # Add statistical context
    anomaly_percentage = (stats["anomaly_count"] / stats["total_logs"]) * 100 if stats["total_logs"] > 0 else 0
    explanations.append(f"During the 30-minute window around this event, {anomaly_percentage:.1f}% of logs were flagged as anomalies.")
    
    # Add severity assessment based on anomaly score
    if score > 0.9:
        explanations.append("This is a critical anomaly that requires immediate attention.")
    elif score > 0.7:
        explanations.append("This is a significant anomaly that should be investigated promptly.")
    else:
        explanations.append("This is a moderate anomaly that should be monitored.")
        
    return " ".join(explanations)

# Add API router to the main app
from .. import app
app.include_router(router, prefix="/anomalies", tags=["anomalies"])
