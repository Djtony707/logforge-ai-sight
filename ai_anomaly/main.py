
import os
import time
import logging
import psycopg2
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/anomaly_detector.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("anomaly_detector")

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Database connection parameters
DB_HOST = os.environ.get("DB_HOST", "db")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_USER = os.environ.get("DB_USER", "logforge")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME", "logforge_db")
PROCESSING_INTERVAL = int(os.environ.get("PROCESSING_INTERVAL", "60"))

def get_db_connection():
    """Create a database connection"""
    try:
        conn = psycopg2.connect(
            host=DB_HOST,
            port=DB_PORT,
            user=DB_USER,
            password=DB_PASSWORD,
            dbname=DB_NAME
        )
        return conn
    except Exception as e:
        logger.error(f"Database connection error: {e}")
        return None

def process_new_logs():
    """Process new logs for anomaly detection"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        with conn.cursor() as cur:
            # Get logs that haven't been processed for anomalies
            cur.execute("""
                SELECT id, ts, host, app, severity, msg
                FROM logs
                WHERE is_anomaly IS NULL
                ORDER BY ts
                LIMIT 1000
            """)
            logs = cur.fetchall()
            
            if not logs:
                return
                
            logger.info(f"Processing {len(logs)} new logs for anomalies")
            
            # Simple placeholder anomaly detection logic
            # In a real implementation, this would use an actual anomaly detection algorithm
            for log in logs:
                log_id = log[0]
                # Placeholder: mark critical and error logs as anomalies
                severity = log[4]
                is_anomaly = severity in ('critical', 'error')
                anomaly_score = 0.9 if is_anomaly else 0.1
                
                # Update the log entry with anomaly information
                cur.execute("""
                    UPDATE logs
                    SET is_anomaly = %s, anomaly_score = %s
                    WHERE id = %s
                """, (is_anomaly, anomaly_score, log_id))
            
            conn.commit()
            logger.info(f"Completed anomaly processing for {len(logs)} logs")
    except Exception as e:
        logger.error(f"Error processing logs for anomalies: {e}")
    finally:
        conn.close()

def main():
    """Main function to run the anomaly detector"""
    logger.info("Starting anomaly detector service")
    
    while True:
        try:
            process_new_logs()
        except Exception as e:
            logger.error(f"Anomaly detection error: {e}")
        
        # Sleep for the specified interval
        time.sleep(PROCESSING_INTERVAL)

if __name__ == "__main__":
    main()
