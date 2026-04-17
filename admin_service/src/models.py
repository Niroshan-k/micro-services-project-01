from sqlalchemy import Column, Integer, String, DateTime, ForeignKey, Boolean, JSON
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from .database import Base

class AdminUser(Base):
    __tablename__ = "admin_users"

    admin_id = Column(String(50), primary_key=True, index=True)
    full_name = Column(String(100), nullable=False)
    email = Column(String(100), unique=True, index=True)
    password_hash = Column(String(255), nullable=False)
    role = Column(String(50)) # superadmin/support/analyst
    is_active = Column(Boolean, default=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    last_login = Column(DateTime(timezone=True), nullable=True)

    sessions = relationship("AdminSession", back_populates="admin")
    audit_logs = relationship("AuditLog", back_populates="admin")
    reports = relationship("Report", back_populates="admin")

class AdminSession(Base):
    __tablename__ = "admin_sessions"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(String(50), ForeignKey("admin_users.admin_id"))
    token_hash = Column(String(255), unique=True)
    ip_address = Column(String(50))
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    expires_at = Column(DateTime(timezone=True))

    admin = relationship("AdminUser", back_populates="sessions")

class AuditLog(Base):
    __tablename__ = "audit_logs"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(String(50), ForeignKey("admin_users.admin_id"))
    action = Column(String(100))
    target_table = Column(String(50))
    target_id = Column(String(50))
    old_value = Column(JSON, nullable=True)
    new_value = Column(JSON, nullable=True)
    ip_address = Column(String(50))
    performed_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("AdminUser", back_populates="audit_logs")

class SystemHealth(Base):
    __tablename__ = "system_health"

    id = Column(Integer, primary_key=True, index=True)
    service_name = Column(String(50), index=True)
    status = Column(String(20)) # up/degraded/down
    response_time_ms = Column(Integer, nullable=True)
    error_message = Column(String(255), nullable=True)
    last_checked = Column(DateTime(timezone=True), server_default=func.now())

class Report(Base):
    __tablename__ = "reports"

    id = Column(Integer, primary_key=True, index=True)
    admin_id = Column(String(50), ForeignKey("admin_users.admin_id"))
    report_type = Column(String(50))
    parameters = Column(JSON, nullable=True)
    file_path = Column(String(255), nullable=True)
    status = Column(String(20), default="pending")
    generated_at = Column(DateTime(timezone=True), server_default=func.now())

    admin = relationship("AdminUser", back_populates="reports")