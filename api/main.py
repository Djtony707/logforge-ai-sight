
import os
import importlib
import asyncio

# Import FastAPI app
from app import app

# Import all routes
from app.routes import auth, logs, alerts, common, anomalies

# Import anomaly detector service
from app.services.anomaly_detector import start_anomaly_detector, stop_anomaly_detector

# Start and stop anomaly detector with app lifecycle
@app.on_event("startup")
async def startup_event():
    # Start anomaly detector in background
    asyncio.create_task(start_anomaly_detector())

@app.on_event("shutdown")
async def shutdown_event():
    await stop_anomaly_detector()

# Run the app with Uvicorn when this file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
