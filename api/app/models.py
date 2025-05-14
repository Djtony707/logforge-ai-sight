
from datetime import datetime
from typing import Optional, List
from pydantic import BaseModel, Field

# Authentication models
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

# Log models
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

# Alert models
class AlertBase(BaseModel):
    name: str
    description: Optional[str] = None
    severity: str
    query: str
    is_active: bool = True

class AlertCreate(AlertBase):
    pass

class AlertUpdate(BaseModel):
    name: Optional[str] = None
    description: Optional[str] = None
    severity: Optional[str] = None
    query: Optional[str] = None
    is_active: Optional[bool] = None

class Alert(AlertBase):
    id: int
    created_at: datetime
    created_by: Optional[int] = None
    last_triggered: Optional[datetime] = None
