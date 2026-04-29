import uuid
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from pydantic import BaseModel
from passlib.context import CryptContext
from . import models, schemas, database

# --- 1. SETUP THE HASHER ---
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Updated hashing functions in your router file
def get_password_hash(password: str):
    # Encoding to utf-8 before hashing is the safest way for bcrypt 4.0+
    return pwd_context.hash(password.encode('utf-8'))

def verify_password(plain_password: str, hashed_password: str):
    # This checks the plain text against the hashed version securely
    return pwd_context.verify(plain_password.encode('utf-8'), hashed_password)

router = APIRouter(tags=["Customer API"])

# --- 2. AUTHENTICATION & REGISTRATION ---

@router.post("/customers", response_model=schemas.CustomerResponse) # <--- CRITICAL SECURITY FIX
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.Customer).filter(models.Customer.email == customer.email).first()
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already exists")
    
    cust_data = customer.model_dump()
    
    # Hash the password and remove the raw text
    raw_password = cust_data.pop("password")
    cust_data["password_hash"] = get_password_hash(raw_password) 
    
    # Auto-generate ID
    cust_data["customer_id"] = f"CUST-{uuid.uuid4().hex[:6].upper()}" 
    
    db_customer = models.Customer(**cust_data)
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    
    # FastAPI will use schemas.CustomerResponse to strip out the password_hash before sending!
    return db_customer

class LoginRequest(BaseModel):
    email: str
    password: str

@router.post("/login")
def login(req: LoginRequest, db: Session = Depends(database.get_db)):
    user = db.query(models.Customer).filter(models.Customer.email == req.email).first()
    
    # Verify hash
    if not user or not verify_password(req.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Invalid credentials")
        
    return {"message": "Success", "customer_id": user.customer_id}


# --- 3. CUSTOMER DATA RETRIEVAL ---

@router.get("/customers", response_model=list[schemas.CustomerResponse])
def get_all_customers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Customer).offset(skip).limit(limit).all()

@router.get("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(database.get_db)):
    customer = db.query(models.Customer).filter(models.Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer


# --- 4. METERS & USAGE DASHBOARD ---

@router.get("/customers/{meter_id}/usage")
def get_usage(meter_id: str, db: Session = Depends(database.get_db)):
    # Used by the React Dashboard
    usage = db.query(models.UsageSummary).filter(models.UsageSummary.meter_id == meter_id).first()
    if not usage:
        return {} 
    return usage

@router.post("/assignments", response_model=schemas.CustomerMeterResponse)
def assign_meter(assignment: schemas.CustomerMeterCreate, db: Session = Depends(database.get_db)):
    customer = db.query(models.Customer).filter(models.Customer.customer_id == assignment.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")

    db_assignment = models.CustomerMeter(**assignment.model_dump())
    db.add(db_assignment)
    db.commit()
    db.refresh(db_assignment)
    return db_assignment

@router.get("/customers/{customer_id}/meters", response_model=list[schemas.CustomerMeterResponse])
def get_customer_meters(customer_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.CustomerMeter).filter(models.CustomerMeter.customer_id == customer_id).all()


# --- 5. BILLING ---

@router.post("/bills", response_model=schemas.BillingRecordResponse)
def create_bill(bill: schemas.BillingRecordCreate, db: Session = Depends(database.get_db)):
    customer = db.query(models.Customer).filter(models.Customer.customer_id == bill.customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
        
    db_bill = models.BillingRecord(**bill.model_dump())
    db.add(db_bill)
    db.commit()
    db.refresh(db_bill)
    return db_bill

@router.get("/customers/{customer_id}/bills", response_model=list[schemas.BillingRecordResponse])
def get_customer_bills(customer_id: str, db: Session = Depends(database.get_db)):
    return db.query(models.BillingRecord).filter(models.BillingRecord.customer_id == customer_id).all()

# telemetry data
class TelemetryPayload(BaseModel):
    meter_id: str
    water_usage_litres: float
    energy_kwh: float
    pressure_bar: float

@router.post("/telemetry")
def update_telemetry(payload: TelemetryPayload, db: Session = Depends(database.get_db)):
    # 1. Check if we already have a summary for this meter
    summary = db.query(models.UsageSummary).filter(models.UsageSummary.meter_id == payload.meter_id).first()
    
    if not summary:
        # 2. If no summary exists, find who owns this meter
        assignment = db.query(models.CustomerMeter).filter(models.CustomerMeter.meter_id == payload.meter_id).first()
        if not assignment:
            # If the meter isn't assigned to anyone, reject the data
            raise HTTPException(status_code=404, detail="Node unassigned or offline.")
            
        summary = models.UsageSummary(
            meter_id=payload.meter_id,
            customer_id=assignment.customer_id,
            total_water_litres=payload.water_usage_litres,
            total_energy_kwh=payload.energy_kwh,
            avg_pressure_bar=payload.pressure_bar
        )
        db.add(summary)
    else:
        # 3. Update existing records
        summary.total_water_litres = payload.water_usage_litres
        summary.total_energy_kwh = payload.energy_kwh
        summary.avg_pressure_bar = payload.pressure_bar
        
    db.commit()
    return {"status": "Telemetry synchronized"}