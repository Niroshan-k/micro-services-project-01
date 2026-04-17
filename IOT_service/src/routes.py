from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database

router = APIRouter(tags=["IoT Platform"])

# ==========================================
# SMART METER ROUTES
# ==========================================

@router.post("/meters", response_model=schemas.SmartMeterResponse)
def register_meter(meter: schemas.SmartMeterCreate, db: Session = Depends(database.get_db)):
    db_meter = models.SmartMeter(**meter.model_dump())
    db.add(db_meter)
    db.commit()
    db.refresh(db_meter)
    return db_meter

@router.get("/meters", response_model=list[schemas.SmartMeterResponse])
def get_all_meters(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.SmartMeter).offset(skip).limit(limit).all()

@router.get("/meters/{meter_id}", response_model=schemas.SmartMeterResponse)
def get_single_meter(meter_id: str, db: Session = Depends(database.get_db)):
    meter = db.query(models.SmartMeter).filter(models.SmartMeter.meter_id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    return meter

@router.put("/meters/{meter_id}", response_model=schemas.SmartMeterResponse)
def update_meter(meter_id: str, meter_update: schemas.SmartMeterCreate, db: Session = Depends(database.get_db)):
    meter = db.query(models.SmartMeter).filter(models.SmartMeter.meter_id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
    
    for key, value in meter_update.model_dump().items():
        setattr(meter, key, value)
        
    db.commit()
    db.refresh(meter)
    return meter

@router.delete("/meters/{meter_id}")
def delete_meter(meter_id: str, db: Session = Depends(database.get_db)):
    meter = db.query(models.SmartMeter).filter(models.SmartMeter.meter_id == meter_id).first()
    if not meter:
        raise HTTPException(status_code=404, detail="Meter not found")
        
    db.delete(meter)
    db.commit()
    return {"message": f"Meter {meter_id} deleted successfully"}


# ==========================================
# TELEMETRY ROUTES
# ==========================================

@router.post("/telemetry", response_model=schemas.TelemetryResponse)
def ingest_data(telemetry: schemas.TelemetryCreate, db: Session = Depends(database.get_db)):
    # 1. Verify the meter exists first
    meter = db.query(models.SmartMeter).filter(models.SmartMeter.meter_id == telemetry.meter_id).first()
    if not meter:
        # Log the failure
        db.add(models.IngestionLog(meter_id=telemetry.meter_id, status="failed", error_message="Unknown Meter ID"))
        db.commit()
        raise HTTPException(status_code=404, detail="Meter not registered in the system")

    # 2. Save the telemetry data
    db_item = models.TelemetryRaw(**telemetry.model_dump())
    db.add(db_item)
    
    # 3. Log the successful ingestion
    db.add(models.IngestionLog(meter_id=telemetry.meter_id, status="success"))
    
    db.commit()
    db.refresh(db_item)
    return db_item

@router.get("/telemetry", response_model=list[schemas.TelemetryResponse])
def get_all_telemetry(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.TelemetryRaw).offset(skip).limit(limit).all()

@router.get("/telemetry/{id}", response_model=schemas.TelemetryResponse)
def get_single_telemetry(id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.TelemetryRaw).filter(models.TelemetryRaw.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Telemetry data not found")
    return item

@router.delete("/telemetry/{id}")
def delete_telemetry(id: int, db: Session = Depends(database.get_db)):
    item = db.query(models.TelemetryRaw).filter(models.TelemetryRaw.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Telemetry data not found")
        
    db.delete(item)
    db.commit()
    return {"message": "Telemetry record deleted successfully"}