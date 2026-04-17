from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database

router = APIRouter(tags=["Admin & Management"])

# ----------------- ADMIN USERS -----------------
@router.post("/admins", response_model=schemas.AdminUserResponse)
def create_admin(admin: schemas.AdminUserCreate, db: Session = Depends(database.get_db)):
    db_admin = models.AdminUser(**admin.model_dump())
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

@router.get("/admins", response_model=list[schemas.AdminUserResponse])
def get_admins(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.AdminUser).offset(skip).limit(limit).all()

# ----------------- AUDIT LOGS -----------------
@router.post("/audit", response_model=schemas.AuditLogResponse)
def log_action(log: schemas.AuditLogCreate, db: Session = Depends(database.get_db)):
    db_log = models.AuditLog(**log.model_dump())
    db.add(db_log)
    db.commit()
    db.refresh(db_log)
    return db_log

@router.get("/audit", response_model=list[schemas.AuditLogResponse])
def get_audit_logs(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.AuditLog).order_by(models.AuditLog.performed_at.desc()).offset(skip).limit(limit).all()

# ----------------- SYSTEM HEALTH -----------------
@router.post("/health-metrics", response_model=schemas.SystemHealthResponse)
def update_health(health: schemas.SystemHealthCreate, db: Session = Depends(database.get_db)):
    db_health = models.SystemHealth(**health.model_dump())
    db.add(db_health)
    db.commit()
    db.refresh(db_health)
    return db_health

@router.get("/health-metrics", response_model=list[schemas.SystemHealthResponse])
def get_system_health(db: Session = Depends(database.get_db)):
    return db.query(models.SystemHealth).order_by(models.SystemHealth.last_checked.desc()).limit(20).all()

# ----------------- REPORTS -----------------
@router.post("/reports", response_model=schemas.ReportResponse)
def request_report(report: schemas.ReportCreate, db: Session = Depends(database.get_db)):
    db_report = models.Report(**report.model_dump())
    db.add(db_report)
    db.commit()
    db.refresh(db_report)
    return db_report