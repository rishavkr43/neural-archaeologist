from fastapi import APIRouter, Depends, HTTPException, BackgroundTasks, status
from sqlalchemy.orm import Session
from pydantic import BaseModel, HttpUrl
from typing import Optional
from datetime import datetime
import uuid
import asyncio

from app.database import get_db
from app.models import Investigation, User, AgentLog
from app.agents.coordinator import Coordinator
from app.utils.auth import verify_token
from fastapi import Header


router = APIRouter(prefix="/api/investigations", tags=["Investigations"])


# Request/Response Models
class InvestigationCreate(BaseModel):
    repo_url: HttpUrl


class InvestigationResponse(BaseModel):
    id: str
    repo_url: str
    status: str
    confidence: Optional[float]
    created_at: datetime
    completed_at: Optional[datetime]
    
    class Config:
        from_attributes = True


class InvestigationDetail(BaseModel):
    id: str
    repo_url: str
    status: str
    confidence: Optional[float]
    findings: dict
    report: Optional[str]
    created_at: datetime
    completed_at: Optional[datetime]


# Dependency to get current user from JWT
def get_current_user(authorization: str = Header(None), db: Session = Depends(get_db)):
    """Extract user from JWT token"""
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Missing or invalid authorization header"
        )
    
    token = authorization.replace("Bearer ", "")
    payload = verify_token(token)
    
    if not payload:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid or expired token"
        )
    
    user_id = payload.get("user_id")
    user = db.query(User).filter(User.id == user_id).first()
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    
    return user


def progress_callback_sync(investigation_id: str, db: Session):
    """Create a callback function for agent progress"""
    def callback(agent_name: str, message: str, data: dict = None):
        # Save agent log to database
        log = AgentLog(
            investigation_id=investigation_id,
            agent_name=agent_name,
            message=message,
            data=data or {}
        )
        db.add(log)
        db.commit()
        
        # Note: WebSocket events will be polled by frontend instead
        # Real-time WebSocket from background tasks is complex in FastAPI
    
    return callback


def run_investigation(investigation_id: str, repo_url: str, db: Session):
    """Background task to run investigation"""
    
    # Get investigation record
    investigation = db.query(Investigation).filter(Investigation.id == investigation_id).first()
    
    if not investigation:
        return
    
    try:
        # Update status
        investigation.status = "processing"
        db.commit()
        
        # Create coordinator with progress callback
        callback = progress_callback_sync(investigation_id, db)
        coordinator = Coordinator(progress_callback=callback)
        
        # Run investigation
        result = coordinator.investigate(repo_url)
        
        # Save results - include full report data in findings for visualization
        investigation.findings = {
            "scout_data": result.get("scout_data", {}),
            "analysis": result.get("analysis", {}),
            "rounds_taken": result.get("rounds_taken", 0),
            "web_search_performed": result.get("web_search_performed", False),
            "report_data": result.get("report", {})  # Full report object with timeline, citations, etc.
        }
        investigation.report = result["report"]["narrative"]
        investigation.confidence = result["confidence"]
        investigation.status = "completed"
        investigation.completed_at = datetime.utcnow()
        
        db.commit()
    
    except Exception as e:
        # Mark as failed
        investigation.status = "failed"
        investigation.report = f"Investigation failed: {str(e)}"
        db.commit()


@router.post("/", response_model=InvestigationResponse, status_code=status.HTTP_201_CREATED)
async def create_investigation(
    data: InvestigationCreate,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Start a new investigation"""
    
    # Create investigation record
    investigation = Investigation(
        id=uuid.uuid4(),
        user_id=current_user.id,
        repo_url=str(data.repo_url),
        status="pending"
    )
    
    db.add(investigation)
    db.commit()
    db.refresh(investigation)
    
    # Queue background task
    background_tasks.add_task(
        run_investigation,
        str(investigation.id),
        str(data.repo_url),
        db
    )
    # return investigation (changed part)
    # Return response with UUID converted to string
    return {
        "id": str(investigation.id),
        "repo_url": investigation.repo_url,
        "status": investigation.status,
        "confidence": investigation.confidence,
        "created_at": investigation.created_at,
        "completed_at": investigation.completed_at
    }


@router.get("/{investigation_id}", response_model=InvestigationDetail)
async def get_investigation(
    investigation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get investigation details"""
    
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigation not found"
        )
    
    return {
        "id": str(investigation.id),
        "repo_url": investigation.repo_url,
        "status": investigation.status,
        "confidence": investigation.confidence,
        "findings": investigation.findings or {},
        "report": investigation.report,
        "created_at": investigation.created_at,
        "completed_at": investigation.completed_at
    }


@router.get("/", response_model=list[InvestigationResponse])
async def list_investigations(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
    skip: int = 0,
    limit: int = 20
):
    """List user's investigations"""
    
    investigations = db.query(Investigation).filter(
        Investigation.user_id == current_user.id
    ).order_by(
        Investigation.created_at.desc()
    ).offset(skip).limit(limit).all()
    
    #return investigations
    # Convert UUIDs to strings in response
    return [
        {
            "id": str(inv.id),
            "repo_url": inv.repo_url,
            "status": inv.status,
            "confidence": inv.confidence,
            "created_at": inv.created_at,
            "completed_at": inv.completed_at
        }
        for inv in investigations
    ]


@router.delete("/{investigation_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_investigation(
    investigation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Delete an investigation"""
    
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigation not found"
        )
    
    db.delete(investigation)
    db.commit()
    
    return None


@router.get("/{investigation_id}/logs")
async def get_investigation_logs(
    investigation_id: str,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """Get agent logs for an investigation"""
    
    # Verify ownership
    investigation = db.query(Investigation).filter(
        Investigation.id == investigation_id,
        Investigation.user_id == current_user.id
    ).first()
    
    if not investigation:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Investigation not found"
        )
    
    # Get logs
    logs = db.query(AgentLog).filter(
        AgentLog.investigation_id == investigation_id
    ).order_by(AgentLog.timestamp.asc()).all()
    
    return [
        {
            "id": log.id,
            "agent_name": log.agent_name,
            "message": log.message,
            "data": log.data,
            "timestamp": log.timestamp
        }
        for log in logs
    ]