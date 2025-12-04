from sqlalchemy import Column, Integer, String, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.core.database import Base
import enum


class UserRole(str, enum.Enum):
    ADMIN = "admin"
    PARENT = "parent"
    PLAYER = "player"


class AuthProvider(str, enum.Enum):
    GOOGLE = "google"
    APPLE = "apple"
    CREDENTIALS = "credentials"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=True)  # Nullable for social logins
    full_name = Column(String, nullable=True)
    role = Column(SQLEnum(UserRole), default=UserRole.PARENT, nullable=False)
    provider = Column(SQLEnum(AuthProvider), default=AuthProvider.CREDENTIALS, nullable=False)
    provider_id = Column(String, nullable=True)  # OAuth provider user ID

    # Relationships
    orders = relationship("StripeOrder", back_populates="user")
