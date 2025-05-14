
from datetime import datetime
import os

from .. import app

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()}

# Main API root
@app.get("/")
async def root():
    return {
        "message": "Welcome to LogForge API",
        "version": "1.0.0",
        "status": "operational"
    }
