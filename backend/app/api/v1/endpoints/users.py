"""
Users endpoints
"""
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
from typing import Optional
import structlog

from app.services.user_service import get_user_by_id, update_user_name
from app.api.v1.endpoints.auth import get_current_user

logger = structlog.get_logger()
router = APIRouter()


class UpdateProfileRequest(BaseModel):
    """Update profile request"""
    name: Optional[str] = Field(default=None, description="User full name")


class UpdateSettingsRequest(BaseModel):
    """Update settings request"""
    privacy_level: Optional[str] = Field(default=None, description="Privacy level: private, friends, public")
    share_location: Optional[bool] = Field(default=None, description="Whether user shares location by default")
    notifications: Optional[bool] = Field(default=None, description="Whether user receives notifications")
    theme: Optional[str] = Field(default=None, description="App theme: light, dark, auto")


@router.get("/me")
async def get_current_user_profile(current_user: dict = Depends(get_current_user)):
    """Get current user profile"""
    try:
        user_id = int(current_user['id'])
        user = await get_user_by_id(user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )
        return {
            "success": True,
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user profile"
        )


@router.patch("/me")
async def update_current_user_profile(
    request: UpdateProfileRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update current user profile"""
    try:
        user_id = int(current_user['id'])
        
        if request.name:
            await update_user_name(user_id, request.name)
            logger.info(f"User {user_id} updated name to: {request.name}")
        
        # Get updated user
        user = await get_user_by_id(user_id)
        
        return {
            "success": True,
            "message": "Profile updated successfully",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user profile: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update profile"
        )


@router.patch("/me/settings")
async def update_user_settings(
    request: UpdateSettingsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update user settings"""
    try:
        user_id = int(current_user['id'])
        
        # Update settings in database
        from app.services.user_service import update_user_settings
        await update_user_settings(
            user_id,
            privacy_level=request.privacy_level,
            share_location=request.share_location,
            notifications=request.notifications,
            theme=request.theme
        )
        
        logger.info(f"User {user_id} updated settings")
        
        # Get updated user
        user = await get_user_by_id(user_id)
        
        return {
            "success": True,
            "message": "Settings updated successfully",
            "user": user
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating user settings: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update settings"
        )

