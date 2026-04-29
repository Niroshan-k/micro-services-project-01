from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class Customer(Base):
    __tablename__ = "customers"

    customer_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    password_hash = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, index=True)
    phone = Column(String(20))
    address = Column(String(255))
    account_type = Column(String(50)) # household/factory/municipal
    status = Column(String(20), default="active")
    created_at = Column(DateTime(timezone=True), server_default=func.now())

    meters = relationship("CustomerMeter", back_populates="customer")
    summaries = relationship("UsageSummary", back_populates="customer")
    bills = relationship("BillingRecord", back_populates="customer")
    sessions = relationship("Session", back_populates="customer")

class CustomerMeter(Base):
    __tablename__ = "customer_meters"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"))
    meter_id = Column(String(50), index=True) # References asu_iot DB
    assigned_at = Column(DateTime(timezone=True), server_default=func.now())
    unassigned_at = Column(DateTime(timezone=True), nullable=True)

    customer = relationship("Customer", back_populates="meters")

class UsageSummary(Base):
    __tablename__ = "usage_summaries"

    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(50), index=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"))
    period = Column(String(20)) # daily/weekly/monthly
    period_start = Column(DateTime(timezone=True))
    total_water_litres = Column(Float, default=0.0)
    total_energy_kwh = Column(Float, default=0.0)
    avg_pressure_bar = Column(Float, default=0.0)
    peak_usage = Column(Float, default=0.0)
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="summaries")

class BillingRecord(Base):
    __tablename__ = "billing_records"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"))
    billing_period_start = Column(DateTime(timezone=True))
    billing_period_end = Column(DateTime(timezone=True))
    water_units = Column(Float)
    energy_units = Column(Float)
    total_amount = Column(Float)
    currency = Column(String(10), default="LKR")
    status = Column(String(20), default="pending") # pending/paid/overdue
    issued_at = Column(DateTime(timezone=True), server_default=func.now())

    customer = relationship("Customer", back_populates="bills")

class Session(Base):
    __tablename__ = "sessions"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), ForeignKey("customers.customer_id"))
    token_hash = Column(String(255), unique=True)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    customer = relationship("Customer", back_populates="sessions")