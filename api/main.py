
import os
import importlib

# Import FastAPI app
from app import app

# Import all routes
from app.routes import auth, logs, alerts, common

# Run the app with Uvicorn when this file is executed directly
if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
