from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from datetime import datetime
from app.core.database import get_db
from app.models import Event, EventType

router = APIRouter()


@router.get("/events")
async def get_events(
    skip: int = 0,
    limit: int = 50,
    event_type: EventType = None,
    upcoming_only: bool = True,
    db: Session = Depends(get_db)
):
    """Get events for the calendar"""
    query = db.query(Event).filter(Event.is_public == True)

    if event_type:
        query = query.filter(Event.event_type == event_type)

    if upcoming_only:
        query = query.filter(Event.start_time >= datetime.utcnow())

    events = query.order_by(Event.start_time.asc()).offset(skip).limit(limit).all()

    return [
        {
            "id": event.id,
            "title": event.title,
            "description": event.description,
            "event_type": event.event_type,
            "start_time": event.start_time.isoformat(),
            "end_time": event.end_time.isoformat() if event.end_time else None,
            "location": event.location,
            "max_participants": event.max_participants,
        }
        for event in events
    ]


@router.get("/events/{event_id}")
async def get_event(event_id: int, db: Session = Depends(get_db)):
    """Get a single event by ID"""
    event = db.query(Event).filter(Event.id == event_id).first()

    if not event:
        raise HTTPException(status_code=404, detail="Event not found")

    return {
        "id": event.id,
        "title": event.title,
        "description": event.description,
        "event_type": event.event_type,
        "start_time": event.start_time.isoformat(),
        "end_time": event.end_time.isoformat() if event.end_time else None,
        "location": event.location,
        "max_participants": event.max_participants,
    }
