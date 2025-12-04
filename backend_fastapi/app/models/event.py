from sqlalchemy import Column, Integer, String, Text, DateTime, Boolean, Enum as SQLEnum
from datetime import datetime
from app.core.database import Base
import enum


class EventType(str, enum.Enum):
    OPEN_GYM = "open_gym"
    TRYOUT = "tryout"
    GAME = "game"
    PRACTICE = "practice"
    TOURNAMENT = "tournament"


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    event_type = Column(SQLEnum(EventType), nullable=False)
    start_time = Column(DateTime, nullable=False)
    end_time = Column(DateTime, nullable=True)
    location = Column(String(255), nullable=True)
    is_public = Column(Boolean, default=True, nullable=False)  # Public vs Portal-only
    max_participants = Column(Integer, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow, nullable=False)
