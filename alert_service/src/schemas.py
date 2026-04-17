from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime

# ================= RULES =================
class AlertRuleCreate(BaseModel):
    rule_id: str = Field(..., min_length=3, max_length=50)
    rule_name: str = Field(..., min_length=3, max_length=100)
    metric: str = Field(..., pattern="^(pressure|leakage|energy_spike|usage_threshold)$")
    operator: str = Field(..., pattern="^(gt|lt|eq)$")
    threshold_value: float
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    is_active: bool = True

class AlertRuleResponse(AlertRuleCreate):
    class Config:
        from_attributes = True

# ================= ALERTS =================
class AlertCreate(BaseModel):
    meter_id: str
    customer_id: str
    rule_id: Optional[str] = None
    severity: str = Field(..., pattern="^(low|medium|high|critical)$")
    message: str

class AlertResponse(AlertCreate):
    alert_id: int
    status: str
    triggered_at: datetime
    resolved_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ================= NOTIFICATIONS =================
class NotificationCreate(BaseModel):
    alert_id: int
    customer_id: str
    channel: str = Field(..., pattern="^(email|sms|push)$")
    recipient: str

class NotificationResponse(NotificationCreate):
    id: int
    status: str
    retry_count: int
    sent_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ================= PREFERENCES =================
class PreferenceCreate(BaseModel):
    customer_id: str
    channel: str = Field(..., pattern="^(email|sms|push)$")
    alert_severity_min: str = Field(..., pattern="^(low|medium|high|critical)$")
    is_enabled: bool = True

class PreferenceResponse(PreferenceCreate):
    id: int
    class Config:
        from_attributes = True