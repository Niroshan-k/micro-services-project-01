from sqlalchemy import Column, Integer, String, Float, DateTime, ForeignKey, Boolean
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class SmartMeter(Base):
    __tablename__ = "smart_meters"
    
    meter_id = Column(String(50), primary_key=True, index=True)
    customer_id = Column(String(50), index=True) # Reference to asu_users DB
    meter_type = Column(String(20)) # water or energy
    location = Column(String(100))
    firmware_version = Column(String(20))
    status = Column(String(20), default="active")
    installed_at = Column(DateTime(timezone=True), server_default=func.now())

    # Relationships
    telemetry = relationship("TelemetryRaw", back_populates="meter")
    anomalies = relationship("TelemetryAnomaly", back_populates="meter")
    logs = relationship("IngestionLog", back_populates="meter")

    """
    What it does: It registers every physical meter the company owns before it can send any data.

    Why it's important: In the real world, you can't just let any random device send data to your servers 
    (that's a security risk). When data comes in, the system checks this table first: "Do I know this meter_id?" 
    If the answer is no, it rejects the data. It also tells the system where the meter is and who owns it (customer_id).
    """

class TelemetryRaw(Base):
    __tablename__ = "telemetry_raw"
    
    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(50), ForeignKey("smart_meters.meter_id"), nullable=False)
    water_usage_litres = Column(Float, nullable=True)
    pressure_bar = Column(Float, nullable=True)
    energy_kwh = Column(Float, nullable=True)
    leakage_flag = Column(Boolean, default=False)
    signal_strength = Column(Integer, nullable=True)
    timestamp = Column(DateTime(timezone=True), server_default=func.now())
    received_at = Column(DateTime(timezone=True), server_default=func.now())

    meter = relationship("SmartMeter", back_populates="telemetry")
    anomalies = relationship("TelemetryAnomaly", back_populates="telemetry_record")
    """
    What it does: It stores the continuous stream of data (water usage, pressure, energy) coming from the registered meters.

    Why it's important: This is the "big data" table. This is what you would migrate to AWS DynamoDB 
    later because it handles massive, rapid streams of information perfectly. It is the raw data used for 
    billing and dashboards.
    """

class TelemetryAnomaly(Base):
    __tablename__ = "telemetry_anomalies"
    
    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(50), ForeignKey("smart_meters.meter_id"), nullable=False)
    telemetry_id = Column(Integer, ForeignKey("telemetry_raw.id"), nullable=True)
    anomaly_type = Column(String(50))
    severity = Column(String(20)) # low/medium/high
    resolved = Column(Boolean, default=False)
    detected_at = Column(DateTime(timezone=True), server_default=func.now())

    meter = relationship("SmartMeter", back_populates="anomalies")
    telemetry_record = relationship("TelemetryRaw", back_populates="anomalies")

    """
    What it does: It flags specific problems. For example, if the telemetry_raw table shows water pressure 
    dropping to 0, an anomaly record is created here.

    Why it's important: This directly hits the assignment requirement for "predictive insights" and AI. 
    Instead of scanning millions of raw data points to find a problem, the Analytics Engine just reads this smaller 
    table to know immediately when and where to send an alert.
    """

class IngestionLog(Base):
    __tablename__ = "ingestion_logs"
    
    id = Column(Integer, primary_key=True, index=True)
    meter_id = Column(String(50), ForeignKey("smart_meters.meter_id"), nullable=False)
    status = Column(String(20)) # success/failed/duplicate
    error_message = Column(String(255), nullable=True)
    payload_size_bytes = Column(Integer, nullable=True)
    received_at = Column(DateTime(timezone=True), server_default=func.now())

    meter = relationship("SmartMeter", back_populates="logs")

    """
    What it does: It records every attempt to send data, whether it succeeded or failed.

    Why it's important: The assignment explicitly asks for improved "security, compliance, and 
    auditability." If a hacker tries to spam fake data using a fake meter_id, it fails, but this table logs 
    the attempt, the time, and the fake ID used. It is crucial for troubleshooting and security audits.
    """