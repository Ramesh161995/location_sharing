"""
Location endpoints for location sharing functionality
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
import structlog

from app.api.v1.endpoints.auth import get_current_user
from app.services.location_service import (
    save_location,
    get_user_current_location,
    get_location_history,
    share_location_with_contacts,
    get_shared_locations,
    get_location_by_id,
    stop_sharing_location,
    get_contacts_user_is_sharing_with,
)
from app.services.user_service import get_user_by_phone

logger = structlog.get_logger()
router = APIRouter()


class LocationUpdate(BaseModel):
    """Location update request"""
    latitude: float = Field(..., description="Latitude")
    longitude: float = Field(..., description="Longitude")
    altitude: Optional[float] = Field(None, description="Altitude in meters")
    accuracy: Optional[float] = Field(None, description="Accuracy in meters")
    speed: Optional[float] = Field(None, description="Speed in m/s")
    heading: Optional[float] = Field(None, description="Heading in degrees")
    address: Optional[str] = Field(None, description="Street address")
    city: Optional[str] = Field(None, description="City name")
    country: Optional[str] = Field(None, description="Country name")


class ShareLocationRequest(BaseModel):
    """Share location request"""
    location_id: int = Field(..., description="Location ID to share")
    contact_user_ids: List[int] = Field(..., description="List of user IDs to share with")
    permission_level: str = Field(default="view", description="Permission level: view, track, full")


class TrackLocationByPhoneRequest(BaseModel):
    """Track location by phone number request"""
    phone: str = Field(..., description="Phone number to track")


class StopSharingRequest(BaseModel):
    """Stop sharing location request"""
    contact_user_id: int = Field(..., description="User ID of contact to stop sharing with")


@router.post("/current", response_model=dict)
async def update_current_location(
    location: LocationUpdate,
    current_user: dict = Depends(get_current_user)
):
    """Update user's current location"""
    try:
        user_id = int(current_user['id'])
        
        location_id = await save_location(
            user_id=user_id,
            latitude=location.latitude,
            longitude=location.longitude,
            altitude=location.altitude,
            accuracy=location.accuracy,
            speed=location.speed,
            heading=location.heading,
            address=location.address,
            city=location.city,
            country=location.country,
        )
        
        logger.info(f"Location updated for user {user_id}, location_id: {location_id}")
        
        return {
            "success": True,
            "message": "Location updated successfully",
            "location_id": location_id
        }
        
    except Exception as e:
        logger.error(f"Error updating location: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update location"
        )


@router.get("/current", response_model=dict)
async def get_current_location(current_user: dict = Depends(get_current_user)):
    """Get user's current location"""
    try:
        user_id = int(current_user['id'])
        location = await get_user_current_location(user_id)
        
        if location:
            return {
                "success": True,
                "location": location
            }
        else:
            return {
                "success": False,
                "message": "No location found",
                "location": None
            }
        
    except Exception as e:
        logger.error(f"Error getting current location: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get location"
        )


@router.get("/history", response_model=dict)
async def get_location_history(
    limit: int = 50,
    current_user: dict = Depends(get_current_user)
):
    """Get user's location history"""
    try:
        user_id = int(current_user['id'])
        history = await get_location_history(user_id, limit=limit)
        
        return {
            "success": True,
            "count": len(history),
            "locations": history
        }
        
    except Exception as e:
        logger.error(f"Error getting location history: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get location history"
        )


@router.post("/share", response_model=dict)
async def share_location(
    request: ShareLocationRequest,
    current_user: dict = Depends(get_current_user)
):
    """Share location with contacts"""
    try:
        user_id = int(current_user['id'])
        
        # Verify location belongs to current user
        location = await get_location_by_id(request.location_id)
        if not location:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Location not found"
            )
        
        # Verify location belongs to current user
        if int(location['user_id']) != user_id:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="You can only share your own locations"
            )
        
        await share_location_with_contacts(
            location_id=request.location_id,
            contact_user_ids=request.contact_user_ids,
            permission_level=request.permission_level
        )
        
        logger.info(f"Location {request.location_id} shared with {len(request.contact_user_ids)} contacts by user {user_id}")
        
        return {
            "success": True,
            "message": "Location shared successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error sharing location: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to share location"
        )


@router.get("/shared", response_model=dict)
async def get_shared_locations_endpoint(current_user: dict = Depends(get_current_user)):
    """Get locations shared with the user"""
    try:
        user_id = int(current_user['id'])
        shared_locations = await get_shared_locations(user_id)
        
        return {
            "success": True,
            "count": len(shared_locations),
            "locations": shared_locations
        }
        
    except Exception as e:
        logger.error(f"Error getting shared locations: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get shared locations"
        )


@router.get("/sharing-with", response_model=dict)
async def get_contacts_sharing_with_endpoint(current_user: dict = Depends(get_current_user)):
    """Get list of contacts the user is currently sharing location with"""
    try:
        user_id = int(current_user['id'])
        contact_user_ids = await get_contacts_user_is_sharing_with(user_id)
        
        return {
            "success": True,
            "count": len(contact_user_ids),
            "contact_user_ids": contact_user_ids
        }
        
    except Exception as e:
        logger.error(f"Error getting contacts sharing with: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get contacts sharing with"
        )


@router.delete("/share/{contact_user_id}", response_model=dict)
async def stop_sharing_location_endpoint(
    contact_user_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Stop sharing location with a specific contact"""
    try:
        user_id = int(current_user['id'])
        
        # Don't allow stopping share with self
        if contact_user_id == user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot stop sharing with yourself"
            )
        
        success = await stop_sharing_location(user_id, contact_user_id)
        
        if success:
            logger.info(f"User {user_id} stopped sharing location with user {contact_user_id}")
            return {
                "success": True,
                "message": "Location sharing stopped successfully"
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="No active location sharing found with this contact"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error stopping location share: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to stop sharing location"
        )


@router.post("/track-by-phone", response_model=dict)
async def track_location_by_phone(
    request: TrackLocationByPhoneRequest,
    current_user: dict = Depends(get_current_user)
):
    """Track location by phone number - gets the user's current location if they've shared with you"""
    try:
        user_id = int(current_user['id'])
        phone = request.phone
        
        # Don't allow tracking own location
        if phone == current_user.get('phone'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot track your own location"
            )
        
        # Find user by phone
        target_user = await get_user_by_phone(phone)
        if not target_user:
            return {
                "success": False,
                "message": "User not found with this phone number",
                "location": None
            }
        
        target_user_id = int(target_user['id'])
        
        # Check if target user has shared location with current user
        # Get all shared locations for current user
        shared_locations = await get_shared_locations(user_id)
        
        # Find if target user has shared with current user
        target_shared_location = None
        for shared_loc in shared_locations:
            if int(shared_loc['user_id']) == target_user_id:
                # Get the most recent shared location
                if not target_shared_location or shared_loc['timestamp'] > target_shared_location['timestamp']:
                    target_shared_location = shared_loc
        
        if target_shared_location:
            return {
                "success": True,
                "message": "Location found",
                "user": {
                    "id": target_user['id'],
                    "phone": target_user['phone'],
                    "name": target_user.get('name'),
                },
                "location": {
                    "latitude": target_shared_location['latitude'],
                    "longitude": target_shared_location['longitude'],
                    "timestamp": target_shared_location['timestamp'],
                    "address": target_shared_location.get('address'),
                    "city": target_shared_location.get('city'),
                    "country": target_shared_location.get('country'),
                }
            }
        else:
            # Check if target user's current location is shared (by checking location shares)
            target_current_location = await get_user_current_location(target_user_id)
            if target_current_location:
                # Check if this location is in shared locations (means it was shared with current user)
                location_found = any(
                    int(loc['id']) == int(target_current_location['id']) 
                    for loc in shared_locations
                )
                
                if location_found:
                    return {
                        "success": True,
                        "message": "Location found",
                        "user": {
                            "id": target_user['id'],
                            "phone": target_user['phone'],
                            "name": target_user.get('name'),
                        },
                        "location": {
                            "latitude": target_current_location['latitude'],
                            "longitude": target_current_location['longitude'],
                            "timestamp": target_current_location['timestamp'],
                            "address": target_current_location.get('address'),
                            "city": target_current_location.get('city'),
                            "country": target_current_location.get('country'),
                        }
                    }
            
            return {
                "success": False,
                "message": "User has not shared their location with you. Ask them to share their location first.",
                "location": None,
                "user": {
                    "id": target_user['id'],
                    "phone": target_user['phone'],
                    "name": target_user.get('name'),
                }
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error tracking location by phone: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to track location"
        )


@router.get("/user/{user_id}", response_model=dict)
async def get_user_location(
    user_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get a specific user's location if they've shared with you"""
    try:
        current_user_id = int(current_user['id'])
        
        # Don't allow getting own location via this endpoint
        if user_id == current_user_id:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Use /location/current to get your own location"
            )
        
        # Check if user has shared location with current user
        shared_locations = await get_shared_locations(current_user_id)
        
        # Find if target user has shared with current user
        target_shared_location = None
        for shared_loc in shared_locations:
            if int(shared_loc['user_id']) == user_id:
                if not target_shared_location or shared_loc['timestamp'] > target_shared_location['timestamp']:
                    target_shared_location = shared_loc
        
        if target_shared_location:
            return {
                "success": True,
                "location": {
                    "latitude": target_shared_location['latitude'],
                    "longitude": target_shared_location['longitude'],
                    "timestamp": target_shared_location['timestamp'],
                    "address": target_shared_location.get('address'),
                    "city": target_shared_location.get('city'),
                    "country": target_shared_location.get('country'),
                }
            }
        else:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="This user has not shared their location with you"
            )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting user location: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get user location"
        )
