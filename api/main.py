
from fastapi import FastAPI, Depends, HTTPException, status, WebSocket, WebSocketDisconnect
from fastapi.security import OAuth2PasswordBearer, OAuth2PasswordRequestForm
from fastapi.middleware.cors import CORSMiddleware
from jose import JWTError, jwt
from passlib.context import CryptContext
from datetime import datetime, timedelta
from typing import List, Dict, Optional, Annotated
import asyncio
import asyncpg
import os
import json
from pydantic import BaseModel, Field

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

# JWT Configuration
SECRET_KEY = os.environ.get("JWT_SECRET", "development_secret_key")
ALGORITHM = os.environ.get("JWT_ALGORITHM", "HS256")
ACCESS_TOKEN_EXPIRE_MINUTES = int(os.environ.get("JWT_EXPIRATION", "60"))

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
oauth2_scheme = OAuth2PasswordBearer(tokenUrl="token")

# Database connection pool
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

db_pool = None

@app.on_event("startup")
async def startup_db_client():
    global db_pool
    db_pool = await get_db_pool()

@app.on_event("shutdown")
async def shutdown_db_client():
    global db_pool
    if db_pool:
        await db_pool.close()

# Pydantic models
class Token(BaseModel):
    access_token: str
    token_type: str
    role: str

class TokenData(BaseModel):
    username: Optional[str] = None
    role: Optional[str] = None

class User(BaseModel):
    username: str
    email: Optional[str] = None
    role: str

class LogBase(BaseModel):
    id: str
    ts: datetime
    host: str
    app: str
    severity: str
    msg: str
    is_anomaly: Optional[bool] = False
    anomaly_score: Optional[float] = None

class LogSearch(BaseModel):
    start_date: Optional[datetime] = None
    end_date: Optional[datetime] = None
    host: Optional[str] = None
    app: Optional[str] = None
    severity: Optional[str] = None
    message: Optional[str] = None
    use_regex: bool = False

# Authentication functions
def verify_password(plain_password, hashed_password):
    return pwd_context.verify(plain_password, hashed_password)

def get_password_hash(password):
    return pwd_context.hash(password)

async def get_user(username: str):
    async with db_pool.acquire() as conn:
        row = await conn.fetchrow("SELECT * FROM users WHERE username = $1", username)
        if row:
            return dict(row)
    return None

async def authenticate_user(username: str, password: str):
    user = await get_user(username)
    if not user:
        return False
    if not verify_password(password, user["password_hash"]):
        return False
    return user

def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
    return encoded_jwt

async def get_current_user(token: Annotated[str, Depends(oauth2_scheme)]):
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        role: str = payload.get("role")
        if username is None:
            raise credentials_exception
        token_data = TokenData(username=username, role=role)
    except JWTError:
        raise credentials_exception
    user = await get_user(username=token_data.username)
    if user is None:
        raise credentials_exception
    return user

async def get_current_active_user(current_user: Annotated[dict, Depends(get_current_user)]):
    return current_user

# Endpoints
@app.post("/token", response_model=Token)
async def login_for_access_token(form_data: Annotated[OAuth2PasswordRequestForm, Depends()]):
    user = await authenticate_user(form_data.username, form_data.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect username or password",
            headers={"WWW-Authenticate": "Bearer"},
        )
    
    # Update last login time
    async with db_pool.acquire() as conn:
        await conn.execute(
            "UPDATE users SET last_login = CURRENT_TIMESTAMP WHERE username = $1", 
            user["username"]
        )
    
    access_token_expires = timedelta(minutes=ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user["username"], "role": user["role"]},
        expires_delta=access_token_expires,
    )
    return {"access_token": access_token, "token_type": "bearer", "role": user["role"]}

@app.get("/users/me", response_model=User)
async def read_users_me(current_user: Annotated[dict, Depends(get_current_active_user)]):
    return {
        "username": current_user["username"],
        "email": current_user["email"],
        "role": current_user["role"]
    }

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

# Start listening for PostgreSQL NOTIFY events
async def listen_for_notifications(client_id: str):
    conn = await asyncpg.connect(
        host=os.environ.get("DB_HOST", "db"),
        port=int(os.environ.get("DB_PORT", "5432")),
        user=os.environ.get("DB_USER", "logforge"),
        password=os.environ.get("DB_PASSWORD"),
        database=os.environ.get("DB_NAME", "logforge_db")
    )
    
    await conn.add_listener('new_log', lambda _, msg: asyncio.create_task(
        manager.broadcast(msg, client_id)
    ))
    
    try:
        # Keep the connection open to receive notifications
        while client_id in manager.active_connections:
            await asyncio.sleep(1)
    finally:
        await conn.close()

@app.websocket("/ws/logs")
async def websocket_endpoint(websocket: WebSocket, client_id: str = None):
    if client_id is None:
        client_id = f"client_{id(websocket)}"
        
    await manager.connect(websocket, client_id)
    
    # Start PostgreSQL NOTIFY listener in background
    listener_task = asyncio.create_task(listen_for_notifications(client_id))
    
    try:
        while True:
            # Just keep the connection alive
            await websocket.receive_text()
    except WebSocketDisconnect:
        manager.disconnect(websocket, client_id)
        listener_task.cancel()

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
