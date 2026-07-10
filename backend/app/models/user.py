"""
User model for the Location Sharing App (MySQL compatible)
"""
from datetime import datetime, timezone
from typing import Optional, List
from pydantic import BaseModel, Field, EmailStr


class UserSettings(BaseModel):
    """User settings model"""
    privacy_level: str = Field(default="private", description="Privacy level: private, friends, public")
    share_location: bool = Field(default=False, description="Whether user shares location by default")
    notifications: bool = Field(default=True, description="Whether user receives notifications")
    theme: str = Field(default="light", description="App theme: light, dark, auto")
    language: str = Field(default="en", description="App language code")
    timezone: str = Field(default="UTC", description="User timezone")


class UserSubscription(BaseModel):
    """User subscription model"""
    plan: str = Field(default="free", description="Subscription plan: free, premium, business")
    expires_at: Optional[datetime] = Field(default=None, description="Subscription expiration date")
    features: List[str] = Field(default_factory=list, description="Available features")


class User(BaseModel):
    """User model (MySQL compatible)"""
    id: Optional[str] = Field(default=None, description="User ID (integer as string)")
    phone: str = Field(..., description="User phone number (unique)")
    name: str = Field(..., description="User full name")
    email: Optional[EmailStr] = Field(default=None, description="User email address")
    avatar: Optional[str] = Field(default=None, description="User avatar URL")
    settings: UserSettings = Field(default_factory=UserSettings)
    subscription: UserSubscription = Field(default_factory=UserSubscription)
    is_verified: bool = Field(default=False, description="Whether phone is verified")
    is_active: bool = Field(default=True, description="Whether user account is active")
    last_seen: Optional[datetime] = Field(default=None, description="Last seen timestamp")
    created_at: Optional[datetime] = Field(default=None, description="Account creation date")
    updated_at: Optional[datetime] = Field(default=None, description="Last update date")

    class Config:
        populate_by_name = True
        json_schema_extra = {
            "example": {
                "id": "1",
                "phone": "+1234567890",
                "name": "John Doe",
                "email": "john@example.com",
                "settings": {
                    "privacy_level": "private",
                    "share_location": False,
                    "notifications": True,
                    "theme": "light"
                },
                "subscription": {
                    "plan": "free",
                    "features": ["basic_sharing", "5_contacts"]
                }
            }
        }


class UserCreate(BaseModel):
    """User creation model"""
    phone: str = Field(..., description="User phone number")
    name: str = Field(..., description="User full name")
    email: Optional[EmailStr] = Field(default=None, description="User email address")


class UserUpdate(BaseModel):
    """User update model"""
    name: Optional[str] = Field(default=None, description="User full name")
    email: Optional[EmailStr] = Field(default=None, description="User email address")
    avatar: Optional[str] = Field(default=None, description="User avatar URL")
    settings: Optional[UserSettings] = Field(default=None, description="User settings")


class UserResponse(BaseModel):
    """User response model"""
    id: str = Field(..., description="User ID")
    phone: str = Field(..., description="User phone number")
    name: str = Field(..., description="User full name")
    email: Optional[str] = Field(default=None, description="User email address")
    avatar: Optional[str] = Field(default=None, description="User avatar URL")
    settings: UserSettings = Field(..., description="User settings")
    subscription: UserSubscription = Field(..., description="User subscription")
    is_verified: bool = Field(..., description="Whether phone is verified")
    is_active: bool = Field(..., description="Whether user account is active")
    last_seen: Optional[datetime] = Field(default=None, description="Last seen timestamp")
    created_at: datetime = Field(..., description="Account creation date")
    updated_at: datetime = Field(..., description="Last update date")

    class Config:
        json_schema_extra = {
            "example": {
                "id": "507f1f77bcf86cd799439011",
                "phone": "+1234567890",
                "name": "John Doe",
                "email": "john@example.com",
                "avatar": "https://example.com/avatar.jpg",
                "settings": {
                    "privacy_level": "private",
                    "share_location": False,
                    "notifications": True,
                    "theme": "light"
                },
                "subscription": {
                    "plan": "free",
                    "features": ["basic_sharing", "5_contacts"]
                },
                "is_verified": True,
                "is_active": True,
                "created_at": "2023-01-01T00:00:00Z",
                "updated_at": "2023-01-01T00:00:00Z"
            }
        }
