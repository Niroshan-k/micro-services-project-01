# src/schemas.py
from pydantic import BaseModel, Field, EmailStr
from typing import Optional, Dict, Any
from datetime import datetime

# ================= ADMIN USERS =================
class AdminUserCreate(BaseModel):
    # Removed admin_id (backend auto-generates this securely)
    full_name: str = Field(..., min_length=2, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8) # Receives raw password from React
    role: str = Field(default="analyst", pattern="^(superadmin|support|analyst)$")

class AdminUserResponse(BaseModel):
    admin_id: str
    full_name: str
    email: EmailStr
    role: str
    is_active: bool
    created_at: datetime
    last_login: Optional[datetime] = None
    
    class Config:
        from_attributes = True

# ================= ADMIN LOGIN =================
class AdminLoginRequest(BaseModel):
    email: EmailStr
    password: str

# ================= AUDIT LOGS =================
class AuditLogCreate(BaseModel):
    admin_id: str
    action: str
    target_table: str
    target_id: str
    old_value: Optional[Dict[str, Any]] = None
    new_value: Optional[Dict[str, Any]] = None
    ip_address: Optional[str] = None

class AuditLogResponse(AuditLogCreate):
    id: int
    performed_at: datetime
    
    class Config:
        from_attributes = True

# ================= SYSTEM HEALTH =================
class SystemHealthCreate(BaseModel):
    service_name: str
    status: str = Field(..., pattern="^(up|degraded|down)$")
    response_time_ms: Optional[int] = None
    error_message: Optional[str] = None

class SystemHealthResponse(SystemHealthCreate):
    id: int
    last_checked: datetime
    
    class Config:
        from_attributes = True

# ================= REPORTS =================
class ReportCreate(BaseModel):
    admin_id: str
    report_type: str
    parameters: Optional[Dict[str, Any]] = None

class ReportResponse(ReportCreate):
    id: int
    file_path: Optional[str] = None
    status: str
    generated_at: datetime
    
    class Config:
        from_attributes = True