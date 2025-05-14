import asyncio
import json
import logging
import random
import uuid
from datetime import datetime, timedelta, date

from .. import db_pool

# Set up logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("anomaly_detector")

class AnomalyDetector:
    def __init__(self):
        self.is_running = False
        self.processing_interval = 20  # seconds
        
    async def start(self):
        """Start the anomaly detection process"""
        self.is_running = True
        logger.info("Starting anomaly detection service")
        await self.detection_loop()
    
    async def stop(self):
        """Stop the anomaly detection process"""
        self.is_running = False
        logger.info("Stopping anomaly detection service")
    
    async def detection_loop(self):
        """Main loop for anomaly detection"""
        while self.is_running:
            try:
                await self.process_recent_logs()
                # Wait before next processing cycle
                await asyncio.sleep(self.processing_interval)
            except Exception as e:
                logger.error(f"Error in anomaly detection loop: {str(e)}")
                await asyncio.sleep(self.processing_interval)
    
    async def process_recent_logs(self):
        """Process recent logs to detect anomalies"""
        try:
            async with db_pool.acquire() as conn:
                # Get logs from the last 5 minutes that haven't been processed for anomalies yet
                query = """
                    SELECT id, ts, host, app, severity, msg
                    FROM logs
                    WHERE ts >= NOW() - INTERVAL '5 minutes'
                    AND anomaly_score IS NULL
                    ORDER BY ts DESC
                    LIMIT 1000
                """
                logs = await conn.fetch(query)
                
                if not logs:
                    return
                
                logger.info(f"Processing {len(logs)} logs for anomalies")
                
                # Process each log
                for log in logs:
                    log_dict = dict(log)
                    anomaly_score = self.calculate_anomaly_score(log_dict)
                    is_anomaly = anomaly_score > 0.5
                    
                    # Update database with anomaly score
                    update_query = """
                        UPDATE logs
                        SET anomaly_score = $1, is_anomaly = $2
                        WHERE id = $3
                    """
                    await conn.execute(update_query, anomaly_score, is_anomaly, log_dict["id"])
                    
                    # If it's an anomaly, notify via PostgreSQL NOTIFY
                    if is_anomaly:
                        log_dict["anomaly_score"] = anomaly_score
                        await conn.execute(
                            "SELECT pg_notify($1, $2)",
                            "new_anomaly",
                            json.dumps(log_dict, default=self.json_serial)
                        )
                        logger.info(f"Detected anomaly: {log_dict['id']} Score: {anomaly_score}")
                
        except Exception as e:
            logger.error(f"Error processing logs for anomalies: {str(e)}")
    
    def calculate_anomaly_score(self, log: dict) -> float:
        """Calculate an anomaly score for a log entry
        
        In a real implementation, this would use a more sophisticated algorithm
        like Isolation Forest, LOF, or a trained ML model.
        """
        # This is a simplified example for demonstration purposes
        score = 0.0
        
        # Check for severity
        if log["severity"] in ["emergency", "alert", "critical"]:
            score += 0.4
        elif log["severity"] == "error":
            score += 0.3
        elif log["severity"] == "warning":
            score += 0.1
        
        # Check for keywords in message
        message = log["msg"].lower()
        keywords = {
            "error": 0.2,
            "failed": 0.2,
            "exception": 0.3,
            "timeout": 0.25,
            "critical": 0.3,
            "crash": 0.35,
            "unavailable": 0.3,
            "refused": 0.25,
            "denied": 0.2,
            "exceeded": 0.2,
            "overflow": 0.3,
            "deadlock": 0.4,
            "corrupt": 0.4
        }
        
        for keyword, weight in keywords.items():
            if keyword in message:
                score += weight
        
        # Cap the score at 1.0
        return min(score, 1.0)
    
    @staticmethod
    def json_serial(obj):
        """JSON serializer for objects not serializable by default json code"""
        if isinstance(obj, (datetime, date)):
            return obj.isoformat()
        raise TypeError("Type not serializable")

# Create a global instance of the anomaly detector
anomaly_detector = AnomalyDetector()

# Function to start the anomaly detector
async def start_anomaly_detector():
    await anomaly_detector.start()

# Function to stop the anomaly detector
async def stop_anomaly_detector():
    await anomaly_detector.stop()
