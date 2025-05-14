
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import os
import asyncpg
from datetime import date, datetime

# Initialize FastAPI app
app = FastAPI(title="LogForge API", version="1.0.0")

# CORS middleware configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For development; restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Database connection pool
db_pool = None

async def get_db_pool():
    return await asyncpg.create_pool(
        host=os.environ.get("DB_HOST", "db"),
        port=int(os.environ.get("DB_PORT", "5432")),
        user=os.environ.get("DB_USER", "logforge"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME", "logforge_db"),
        min_size=1,
        max_size=10,
    )

@app.on_event("startup")
async def startup_db_client():
    global db_pool
    db_pool = await get_db_pool()

@app.on_event("shutdown")
async def shutdown_db_client():
    global db_pool
    if db_pool:
        await db_pool.close()

# Add JSON serialization helper for datetime objects
def json_serial(obj):
    """JSON serializer for objects not serializable by default json code"""
    if isinstance(obj, (datetime, date)):
        return obj.isoformat()
    raise TypeError("Type not serializable")
