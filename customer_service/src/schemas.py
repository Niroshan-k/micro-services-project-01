from pydantic import BaseModel, Field, EmailStr
from typing import Optional, List
from datetime import datetime

# ================= CUSTOMERS =================
class CustomerCreate(BaseModel):
    full_name: str = Field(..., min_length=2, max_length=100)
    password: str = Field(..., min_length=7, max_length=100)
    email: EmailStr
    phone: str = Field(..., min_length=10, max_length=20)
    address: str = Field(..., min_length=5, max_length=255)
    account_type: str = Field(..., pattern="^(household|factory|municipal)$")

class CustomerResponse(BaseModel):
    customer_id: str
    full_name: str
    email: str
    phone: str
    address: str
    account_type: str
    status: str
    created_at: datetime

    class Config:
        from_attributes = True

# ================= METER ASSIGNMENTS =================
class CustomerMeterCreate(BaseModel):
    customer_id: str = Field(..., min_length=1, max_length=50)
    meter_id: str = Field(..., min_length=3, max_length=50)

class CustomerMeterResponse(CustomerMeterCreate):
    id: int
    assigned_at: datetime
    unassigned_at: Optional[datetime] = None
    class Config:
        from_attributes = True

# ================= BILLING =================
class BillingRecordCreate(BaseModel):
    customer_id: str
    billing_period_start: datetime
    billing_period_end: datetime
    water_units: float = Field(..., ge=0)
    energy_units: float = Field(..., ge=0)
    total_amount: float = Field(..., ge=0)
    currency: str = Field(default="LKR", max_length=10)

class BillingRecordResponse(BillingRecordCreate):
    id: int
    status: str
    issued_at: datetime
    class Config:
        from_attributes = True