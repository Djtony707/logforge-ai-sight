
import os
import time
import logging
import psycopg2
import pandas as pd
from datetime import datetime, timedelta
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.FileHandler("logs/forecast.log"),
        logging.StreamHandler()
    ]
)
logger = logging.getLogger("forecast_service")

# Ensure logs directory exists
os.makedirs("logs", exist_ok=True)

# Database connection parameters
DB_HOST = os.environ.get("DB_HOST", "db")
DB_PORT = os.environ.get("DB_PORT", "5432")
DB_USER = os.environ.get("DB_USER", "logforge")
DB_PASSWORD = os.environ.get("DB_PASSWORD")
DB_NAME = os.environ.get("DB_NAME", "logforge_db")
FORECAST_INTERVAL = int(os.environ.get("FORECAST_INTERVAL", "86400"))  # 24 hours by default

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

def generate_forecast():
    """Generate forecasts for log volumes"""
    conn = get_db_connection()
    if not conn:
        return

    try:
        logger.info("Starting forecast generation")
        with conn.cursor() as cur:
            # Get historical log counts by day for the past 30 days
            cur.execute("""
                SELECT 
                    date_trunc('day', ts) as day,
                    count(*) as log_count
                FROM logs
                WHERE ts >= NOW() - INTERVAL '30 days'
                GROUP BY day
                ORDER BY day
            """)
            
            results = cur.fetchall()
            
            if not results or len(results) < 7:  # Need enough data for forecasting
                logger.info("Not enough historical data for forecasting")
                return
            
            # Convert to DataFrame
            df = pd.DataFrame(results, columns=['day', 'log_count'])
            
            # Simple forecasting logic (in a real implementation, this would use Prophet or another forecasting model)
            # For this placeholder, we'll just use a simple moving average
            avg_count = df['log_count'].mean()
            std_count = df['log_count'].std()
            
            # Generate forecast for next 7 days
            forecast_dates = []
            last_date = df['day'].max()
            
            for i in range(1, 8):
                forecast_day = last_date + timedelta(days=i)
                forecast_dates.append(forecast_day)
            
            # Insert forecasts into database
            for forecast_day in forecast_dates:
                cur.execute("""
                    INSERT INTO forecasts (ts, metric, value, lower_bound, upper_bound)
                    VALUES (%s, %s, %s, %s, %s)
                    ON CONFLICT (ts, metric) DO UPDATE
                    SET value = EXCLUDED.value,
                        lower_bound = EXCLUDED.lower_bound,
                        upper_bound = EXCLUDED.upper_bound
                """, (
                    forecast_day, 
                    'log_count', 
                    avg_count, 
                    avg_count - std_count, 
                    avg_count + std_count
                ))
            
            conn.commit()
            logger.info(f"Generated forecasts for the next 7 days")
            
    except Exception as e:
        logger.error(f"Error generating forecast: {e}")
    finally:
        conn.close()

def main():
    """Main function to run the forecast service"""
    logger.info("Starting forecast service")
    
    while True:
        try:
            generate_forecast()
        except Exception as e:
            logger.error(f"Forecast error: {e}")
        
        # Sleep for the forecast interval (typically once per day)
        time.sleep(FORECAST_INTERVAL)

if __name__ == "__main__":
    main()
