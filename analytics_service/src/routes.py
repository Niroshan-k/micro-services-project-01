from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database

router = APIRouter(tags=["Analytics Engine"])

# ----------------- ML MODELS -----------------
@router.post("/models", response_model=schemas.ForecastModelResponse)
def register_model(model: schemas.ForecastModelCreate, db: Session = Depends(database.get_db)):
    db_model = models.ForecastModel(**model.model_dump())
    db.add(db_model)
    db.commit()
    db.refresh(db_model)
    return db_model

@router.get("/models", response_model=list[schemas.ForecastModelResponse])
def get_models(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.ForecastModel).offset(skip).limit(limit).all()

# ----------------- FORECASTS -----------------
@router.post("/forecasts", response_model=schemas.DemandForecastResponse)
def save_forecast(forecast: schemas.DemandForecastCreate, db: Session = Depends(database.get_db)):
    # Verify model exists
    ml_model = db.query(models.ForecastModel).filter(models.ForecastModel.model_id == forecast.model_id).first()
    if not ml_model:
        raise HTTPException(status_code=404, detail="ML Model not found")

    db_forecast = models.DemandForecast(**forecast.model_dump())
    db.add(db_forecast)
    db.commit()
    db.refresh(db_forecast)
    return db_forecast

@router.get("/forecasts/{meter_id}", response_model=list[schemas.DemandForecastResponse])
def get_meter_forecasts(meter_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.DemandForecast).filter(models.DemandForecast.meter_id == meter_id).all()

# ----------------- TRAINING JOBS -----------------
@router.post("/training", response_model=schemas.ModelTrainingJobResponse)
def trigger_training(job: schemas.ModelTrainingJobCreate, db: Session = Depends(database.get_db)):
    db_job = models.ModelTrainingJob(**job.model_dump())
    db.add(db_job)
    db.commit()
    db.refresh(db_job)
    return db_job