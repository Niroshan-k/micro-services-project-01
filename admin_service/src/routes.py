import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from . import models, schemas, database

# --- SETUP SECURITY ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

def get_password_hash(password: str):
    return pwd_context.hash(password.encode('utf-8'))

def verify_password(plain_password: str, hashed_password: str):
    return pwd_context.verify(plain_password.encode('utf-8'), hashed_password)

router = APIRouter(tags=["Admin & Management"])

# ----------------- ADMIN AUTHENTICATION -----------------

@router.post("/admins", response_model=schemas.AdminUserResponse)
def create_admin(admin: schemas.AdminUserCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.AdminUser).filter(models.AdminUser.email == admin.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Admin email already exists")
    
    admin_data = admin.model_dump()
    raw_password = admin_data.pop("password")
    admin_data["password_hash"] = get_password_hash(raw_password) 
    
    # Optional: Auto-generate ID if your DB model requires it
    if hasattr(models.AdminUser, 'admin_id') and 'admin_id' not in admin_data:
        admin_data["admin_id"] = f"ADM-{uuid.uuid4().hex[:6].upper()}" 
    
    db_admin = models.AdminUser(**admin_data)
    db.add(db_admin)
    db.commit()
    db.refresh(db_admin)
    return db_admin

class AdminLoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: AdminLoginRequest, db: Session = Depends(database.get_db)):
    admin = db.query(models.AdminUser).filter(models.AdminUser.email == req.email).first()
    
    if not admin or not verify_password(req.password, admin.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    # Adjust "admin_id" if your primary key is named differently
    return {"message": "Success", "admin_id": admin.admin_id}

# ----------------- ADMIN USERS -----------------

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