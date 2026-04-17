from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from . import models, schemas, database

router = APIRouter(tags=["Customer API"])

# ----------------- CUSTOMERS -----------------
@router.post("/customers", response_model=schemas.CustomerResponse)
def create_customer(customer: schemas.CustomerCreate, db: Session = Depends(database.get_db)):
    existing_user = db.query(models.Customer).filter(
        (models.Customer.email == customer.email) | 
        (models.Customer.customer_id == customer.customer_id)
    ).first()
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Customer ID or Email already exists")
    
    db_customer = models.Customer(**customer.model_dump())
    db.add(db_customer)
    db.commit()
    db.refresh(db_customer)
    return db_customer

@router.get("/customers", response_model=list[schemas.CustomerResponse])
def get_all_customers(skip: int = 0, limit: int = 100, db: Session = Depends(database.get_db)):
    return db.query(models.Customer).offset(skip).limit(limit).all()

@router.get("/customers/{customer_id}", response_model=schemas.CustomerResponse)
def get_customer(customer_id: str, db: Session = Depends(database.get_db)):
    customer = db.query(models.Customer).filter(models.Customer.customer_id == customer_id).first()
    if not customer:
        raise HTTPException(status_code=404, detail="Customer not found")
    return customer

# ----------------- METERS -----------------
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

# ----------------- BILLING -----------------
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