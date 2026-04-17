from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class ForecastModel(Base):
    __tablename__ = "forecast_models"

    model_id = Column(String(50), primary_key=True, index=True)
    meter_id = Column(String(50), index=True) # Logical ref to asu_iot DB
    model_type = Column(String(50)) # demand_forecast/anomaly_detection
    algorithm = Column(String(50))
    trained_at = Column(DateTime(timezone=True), server_default=func.now())
    accuracy_score = Column(Float, nullable=True)
    is_active = Column(Boolean, default=False)

    forecasts = relationship("DemandForecast", back_populates="model")
    training_jobs = relationship("ModelTrainingJob", back_populates="model")

class DemandForecast(Base):
    __tablename__ = "demand_forecasts"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(50), index=True) 
    model_id = Column(String(50), ForeignKey("forecast_models.model_id"))
    forecast_date = Column(DateTime(timezone=True))
    predicted_water_litres = Column(Float, nullable=True)
    predicted_energy_kwh = Column(Float, nullable=True)
    confidence_interval_low = Column(Float, nullable=True)
    confidence_interval_high = Column(Float, nullable=True)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    model = relationship("ForecastModel", back_populates="forecasts")

class AggregatedMetric(Base):
    __tablename__ = "aggregated_metrics"

    id = Column(Integer, primary_key=True, index=True)
    region = Column(String(100), index=True)
    metric_type = Column(String(20)) # water/energy
    period = Column(String(20)) # daily/weekly/monthly
    period_start = Column(DateTime(timezone=True))
    total_consumption = Column(Float, default=0.0)
    avg_consumption = Column(Float, default=0.0)
    peak_demand = Column(Float, default=0.0)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

class ModelTrainingJob(Base):
    __tablename__ = "model_training_jobs"

    id = Column(Integer, primary_key=True, index=True)
    model_id = Column(String(50), ForeignKey("forecast_models.model_id"))
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    completed_at = Column(DateTime(timezone=True), nullable=True)
    status = Column(String(20), default="running") # running/completed/failed
    dataset_size_rows = Column(Integer, nullable=True)
    notes = Column(String(255), nullable=True)

    model = relationship("ForecastModel", back_populates="training_jobs")