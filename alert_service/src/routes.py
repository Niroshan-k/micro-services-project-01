from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from . import models, schemas, database

router = APIRouter(tags=["Alerts & Notifications"])

# ----------------- RULES -----------------
@router.post("/rules", response_model=schemas.AlertRuleResponse)
def create_rule(rule: schemas.AlertRuleCreate, db: Session = Depends(database.get_db)):
    db_rule = models.AlertRule(**rule.model_dump())
    db.add(db_rule)
    db.commit()
    db.refresh(db_rule)
    return db_rule

@router.get("/rules", response_model=list[schemas.AlertRuleResponse])
def get_rules(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.AlertRule).offset(skip).limit(limit).all()

# ----------------- ALERTS -----------------
@router.post("/alerts", response_model=schemas.AlertResponse)
def trigger_alert(alert: schemas.AlertCreate, db: Session = Depends(database.get_db)):
    db_alert = models.Alert(**alert.model_dump())
    db.add(db_alert)
    db.commit()
    db.refresh(db_alert)
    return db_alert

@router.get("/alerts", response_model=list[schemas.AlertResponse])
def get_alerts(meter_id: str = None, customer_id: str = None, skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    query = db.query(models.Alert)
    if meter_id:
        query = query.filter(models.Alert.meter_id == meter_id)
    if customer_id:
        query = query.filter(models.Alert.customer_id == customer_id)
    return query.offset(skip).limit(limit).all()

@router.put("/alerts/{alert_id}/resolve", response_model=schemas.AlertResponse)
def resolve_alert(alert_id: int, db: Session = Depends(database.get_db)):
    alert = db.query(models.Alert).filter(models.Alert.alert_id == alert_id).first()
    if not alert:
        raise HTTPException(status_code=404, detail="Alert not found")
    
    alert.status = "resolved"
    alert.resolved_at = datetime.now()
    db.commit()
    db.refresh(alert)
    return alert

# ----------------- NOTIFICATIONS -----------------
@router.post("/notifications", response_model=schemas.NotificationResponse)
def log_notification(notification: schemas.NotificationCreate, db: Session = Depends(database.get_db)):
    db_notif = models.Notification(**notification.model_dump())
    db.add(db_notif)
    db.commit()
    db.refresh(db_notif)
    return db_notif

# ----------------- PREFERENCES -----------------
@router.post("/preferences", response_model=schemas.PreferenceResponse)
def set_preference(pref: schemas.PreferenceCreate, db: Session = Depends(database.get_db)):
    # Check if preference for this channel already exists for the user
    existing = db.query(models.NotificationPreference).filter(
        models.NotificationPreference.customer_id == pref.customer_id,
        models.NotificationPreference.channel == pref.channel
    ).first()
    
    if existing:
        for key, value in pref.model_dump().items():
            setattr(existing, key, value)
        db.commit()
        db.refresh(existing)
        return existing
    else:
        db_pref = models.NotificationPreference(**pref.model_dump())
        db.add(db_pref)
        db.commit()
        db.refresh(db_pref)
        return db_pref

@router.get("/preferences/{customer_id}", response_model=list[schemas.PreferenceResponse])
def get_preferences(customer_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.NotificationPreference).filter(models.NotificationPreference.customer_id == customer_id).all()