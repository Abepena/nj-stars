"""
Pydantic schemas for authentication
"""

from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegister(BaseModel):
    """Schema for user registration"""

    email: EmailStr
    password: str
    full_name: Optional[str] = None


class UserLogin(BaseModel):
    """Schema for user login"""

    email: EmailStr
    password: str


class Token(BaseModel):
    """Schema for access token response"""

    access_token: str
    token_type: str


class TokenData(BaseModel):
    """Schema for token payload data"""

    email: Optional[str] = None
    user_id: Optional[int] = None
    role: Optional[str] = None


class UserResponse(BaseModel):
    """Schema for user response"""

    id: int
    email: str
    full_name: Optional[str] = None
    role: str
    provider: str

    class Config:
        from_attributes = True
