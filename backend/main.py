"""
Life OS Capture - Minimal FastAPI Backend
Frictionless phone capture + daily task output (Building Block #1: Dropbox)
"""

from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from datetime import datetime, date
from typing import Optional, List
from enum import Enum
import uuid
import os

app = FastAPI(
    title="Life OS Capture API",
    description="Minimal API for phone capture and daily tasks",
    version="1.0.0"
)

# CORS for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, restrict to your domain
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ============ MODELS ============

class CaptureType(str, Enum):
    idea = "idea"
    note = "note"
    task = "task"
    event = "event"
    link = "link"
    youtube = "youtube"
    voice = "voice"


class CaptureCreate(BaseModel):
    type: CaptureType
    content: str = Field(..., min_length=1)
    context: Optional[str] = Field(None, description="Why you saved this")
    url: Optional[str] = None
    scheduled_at: Optional[datetime] = None


class Capture(BaseModel):
    id: str
    type: CaptureType
    content: str
    context: Optional[str] = None
    url: Optional[str] = None
    scheduled_at: Optional[datetime] = None
    created_at: datetime
    synced: bool = False


class TaskItem(BaseModel):
    id: str
    title: str
    priority: int = 2
    completed: bool = False
    completed_at: Optional[datetime] = None


class DailySummary(BaseModel):
    date: str
    total_tasks: int
    completed_tasks: int
    completed_ids: List[str]
    incomplete_ids: List[str]


# ============ IN-MEMORY STORAGE ============
# For production, connect to Railway PostgreSQL

_captures: dict[str, Capture] = {}
_tasks: dict[str, TaskItem] = {}
_completions: dict[str, datetime] = {}


# ============ CAPTURE ENDPOINTS ============

@app.post("/api/capture", response_model=Capture)
async def create_capture(capture: CaptureCreate) -> Capture:
    """Create a new capture item."""
    capture_id = str(uuid.uuid4())[:8]
    new_capture = Capture(
        id=capture_id,
        type=capture.type,
        content=capture.content,
        context=capture.context,
        url=capture.url,
        scheduled_at=capture.scheduled_at,
        created_at=datetime.utcnow(),
        synced=False
    )
    _captures[capture_id] = new_capture
    return new_capture


@app.get("/api/capture", response_model=List[Capture])
async def list_captures(synced: Optional[bool] = None) -> List[Capture]:
    """List all captures, optionally filtered by sync status."""
    captures = list(_captures.values())
    if synced is not None:
        captures = [c for c in captures if c.synced == synced]
    return sorted(captures, key=lambda c: c.created_at, reverse=True)


@app.get("/api/capture/{capture_id}", response_model=Capture)
async def get_capture(capture_id: str) -> Capture:
    """Get a specific capture."""
    if capture_id not in _captures:
        raise HTTPException(status_code=404, detail="Capture not found")
    return _captures[capture_id]


@app.delete("/api/capture/{capture_id}")
async def delete_capture(capture_id: str) -> dict:
    """Delete a capture (called after sync to local)."""
    if capture_id not in _captures:
        raise HTTPException(status_code=404, detail="Capture not found")
    del _captures[capture_id]
    return {"success": True, "message": f"Capture {capture_id} deleted"}


@app.post("/api/capture/{capture_id}/mark-synced")
async def mark_capture_synced(capture_id: str) -> Capture:
    """Mark a capture as synced to local system."""
    if capture_id not in _captures:
        raise HTTPException(status_code=404, detail="Capture not found")
    _captures[capture_id].synced = True
    return _captures[capture_id]


# ============ TASK ENDPOINTS ============

@app.get("/api/tasks/today", response_model=List[TaskItem])
async def get_today_tasks() -> List[TaskItem]:
    """Get today's tasks (would connect to Beads in production)."""
    # In production: query Beads bd ready
    # For now, return mock tasks or stored tasks
    if not _tasks:
        # Seed with sample tasks for demo
        sample_tasks = [
            TaskItem(id="task-1", title="Review morning captures", priority=1),
            TaskItem(id="task-2", title="Process voice notes", priority=1),
            TaskItem(id="task-3", title="Check email", priority=2),
            TaskItem(id="task-4", title="Daily standup", priority=2),
            TaskItem(id="task-5", title="Code review", priority=2),
        ]
        for task in sample_tasks:
            _tasks[task.id] = task

    tasks = list(_tasks.values())
    # Apply completions
    for task in tasks:
        if task.id in _completions:
            task.completed = True
            task.completed_at = _completions[task.id]

    return sorted(tasks, key=lambda t: (t.completed, t.priority))


@app.post("/api/tasks/{task_id}/complete")
async def complete_task(task_id: str) -> TaskItem:
    """Mark a task as complete."""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    _completions[task_id] = datetime.utcnow()
    task = _tasks[task_id]
    task.completed = True
    task.completed_at = _completions[task_id]
    return task


@app.post("/api/tasks/{task_id}/uncomplete")
async def uncomplete_task(task_id: str) -> TaskItem:
    """Mark a task as incomplete."""
    if task_id not in _tasks:
        raise HTTPException(status_code=404, detail="Task not found")

    if task_id in _completions:
        del _completions[task_id]

    task = _tasks[task_id]
    task.completed = False
    task.completed_at = None
    return task


# ============ SYNC ENDPOINTS ============

@app.get("/api/sync/pending")
async def get_pending_sync() -> dict:
    """Get items pending sync to local system."""
    pending = [c for c in _captures.values() if not c.synced]
    return {
        "captures": [c.model_dump() for c in pending],
        "count": len(pending)
    }


@app.post("/api/sync/daily-summary")
async def submit_daily_summary(summary: DailySummary) -> dict:
    """Submit end-of-day summary (to be synced to local Memory MCP)."""
    # In production: store and sync to local Memory MCP when PC online
    return {
        "success": True,
        "message": f"Summary for {summary.date} recorded",
        "stats": {
            "total": summary.total_tasks,
            "completed": summary.completed_tasks,
            "completion_rate": round(summary.completed_tasks / max(summary.total_tasks, 1) * 100, 1)
        }
    }


# ============ HEALTH ============

@app.get("/health")
async def health_check() -> dict:
    """Health check endpoint."""
    return {
        "status": "healthy",
        "service": "life-os-capture",
        "timestamp": datetime.utcnow().isoformat()
    }


@app.get("/")
async def root() -> dict:
    """Root endpoint."""
    return {
        "service": "Life OS Capture API",
        "version": "1.0.0",
        "docs": "/docs"
    }
