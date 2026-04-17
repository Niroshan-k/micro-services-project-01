from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

class SmartMeterCreate(BaseModel):
    meter_id: str = Field(..., min_length=3, max_length=50)
    customer_id: str = Field(..., min_length=1, max_length=50)
    meter_type: str = Field(..., pattern="^(water|energy)$")
    location: str = Field(..., min_length=2, max_length=100)
    firmware_version: str = Field(..., max_length=20)

class SmartMeterResponse(SmartMeterCreate):
    status: str
    installed_at: datetime
    class Config:
        from_attributes = True

class TelemetryCreate(BaseModel):
    meter_id: str = Field(..., min_length=3, max_length=50)
    water_usage_litres: Optional[float] = Field(0.0, ge=0)
    pressure_bar: Optional[float] = Field(0.0, ge=0)
    energy_kwh: Optional[float] = Field(0.0, ge=0)
    leakage_flag: bool = False
    signal_strength: Optional[int] = Field(100, ge=0, le=100)

class TelemetryResponse(TelemetryCreate):
    id: int
    timestamp: datetime
    class Config:
        from_attributes = True