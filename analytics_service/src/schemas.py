from pydantic import BaseModel, Field
from typing import Optional
from datetime import datetime

# ================= MODELS =================
class ForecastModelCreate(BaseModel):
    model_id: str = Field(..., min_length=3, max_length=50)
    meter_id: str = Field(..., min_length=3, max_length=50)
    model_type: str = Field(..., pattern="^(demand_forecast|anomaly_detection)$")
    algorithm: str
    accuracy_score: Optional[float] = Field(None, ge=0.0, le=1.0)
    is_active: bool = False

class ForecastModelResponse(ForecastModelCreate):
    trained_at: datetime
    class Config:
        from_attributes = True

# ================= FORECASTS =================
class DemandForecastCreate(BaseModel):
    meter_id: str
    model_id: str
    forecast_date: datetime
    predicted_water_litres: Optional[float] = 0.0
    predicted_energy_kwh: Optional[float] = 0.0
    confidence_interval_low: Optional[float] = 0.0
    confidence_interval_high: Optional[float] = 0.0

class DemandForecastResponse(DemandForecastCreate):
    id: int
    generated_at: datetime
    class Config:
        from_attributes = True

# ================= TRAINING JOBS =================
class ModelTrainingJobCreate(BaseModel):
    model_id: str
    dataset_size_rows: int
    notes: Optional[str] = None

class ModelTrainingJobResponse(ModelTrainingJobCreate):
    id: int
    status: str
    triggered_at: datetime
    completed_at: Optional[datetime] = None
    class Config:
        from_attributes = True