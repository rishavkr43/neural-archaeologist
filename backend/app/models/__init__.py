from sqlalchemy import Column, String, DateTime, Float, ForeignKey, Integer, Text
from sqlalchemy.dialects.postgresql import UUID, JSONB
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
from datetime import datetime
import uuid

Base = declarative_base()


class User(Base):
    __tablename__ = "users"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String, unique=True, nullable=False, index=True)
    password_hash = Column(String, nullable=False)
    created_at = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    investigations = relationship("Investigation", back_populates="user")


class Investigation(Base):
    __tablename__ = "investigations"
    
    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)
    repo_url = Column(Text, nullable=False)
    status = Column(String, default="pending")  # pending, processing, completed, failed
    findings = Column(JSONB, default={})  # Scout and Analyst data
    report = Column(Text, nullable=True)  # Final narrative from Narrator
    confidence = Column(Float, default=0.0)
    created_at = Column(DateTime, default=datetime.utcnow)
    completed_at = Column(DateTime, nullable=True)
    
    # Relationships
    user = relationship("User", back_populates="investigations")
    agent_logs = relationship("AgentLog", back_populates="investigation", cascade="all, delete-orphan")


class AgentLog(Base):
    __tablename__ = "agent_logs"
    
    id = Column(Integer, primary_key=True, autoincrement=True)
    investigation_id = Column(UUID(as_uuid=True), ForeignKey("investigations.id"), nullable=False)
    agent_name = Column(String, nullable=False)  # scout, analyst, narrator, coordinator
    message = Column(Text, nullable=False)
    data = Column(JSONB, default={})  # Additional context
    timestamp = Column(DateTime, default=datetime.utcnow)
    
    # Relationship
    investigation = relationship("Investigation", back_populates="agent_logs")


class RepoCache(Base):
    __tablename__ = "repo_cache"
    
    repo_url = Column(Text, primary_key=True)
    git_data = Column(JSONB, default={})  # Cached commit data
    last_updated = Column(DateTime, default=datetime.utcnow)