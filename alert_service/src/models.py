from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class AlertRule(Base):
    __tablename__ = "alert_rules"

    rule_id = Column(String(50), primary_key=True, index=True)
    rule_name = Column(String(100), nullable=False)
    metric = Column(String(50)) # pressure/leakage/energy_spike/usage_threshold
    operator = Column(String(10)) # gt/lt/eq
    threshold_value = Column(Float, nullable=False)
    severity = Column(String(20)) # low/medium/high/critical
    is_active = Column(Boolean, default=True)

    alerts = relationship("Alert", back_populates="rule")

class Alert(Base):
    __tablename__ = "alerts"

    alert_id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(50), index=True) # Logical ref to asu_iot DB
    customer_id = Column(String(50), index=True) # Logical ref to asu_customers DB
    rule_id = Column(String(50), ForeignKey("alert_rules.rule_id"), nullable=True)
    severity = Column(String(20))
    message = Column(String(255))
    status = Column(String(20), default="open") # open/acknowledged/resolved
    triggered_at = Column(DateTime(timezone=True), server_default=func.now())
    resolved_at = Column(DateTime(timezone=True), nullable=True)

    rule = relationship("AlertRule", back_populates="alerts")
    notifications = relationship("Notification", back_populates="alert")

class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    alert_id = Column(Integer, ForeignKey("alerts.alert_id"))
    customer_id = Column(String(50), index=True) 
    channel = Column(String(20)) # email/sms/push
    recipient = Column(String(100)) # email address or phone number
    status = Column(String(20), default="pending") # sent/failed/pending
    retry_count = Column(Integer, default=0)
    sent_at = Column(DateTime(timezone=True), nullable=True)

    alert = relationship("Alert", back_populates="notifications")

class NotificationPreference(Base):
    __tablename__ = "notification_preferences"

    id = Column(Integer, primary_key=True, index=True)
    customer_id = Column(String(50), index=True)
    channel = Column(String(20)) # email/sms/push
    alert_severity_min = Column(String(20)) # low/medium/high/critical
    is_enabled = Column(Boolean, default=True)