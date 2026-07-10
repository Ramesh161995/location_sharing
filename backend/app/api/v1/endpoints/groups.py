"""
Groups endpoints
"""
from typing import Optional, List
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
import structlog

from app.api.v1.endpoints.auth import get_current_user
from app.services.group_service import (
    create_group,
    get_user_groups,
    get_group_by_id,
    update_group,
    delete_group,
    get_group_members,
    add_group_member,
    remove_group_member,
)

logger = structlog.get_logger()
router = APIRouter()


class CreateGroupRequest(BaseModel):
    """Create group request"""
    name: str = Field(..., description="Group name")
    description: Optional[str] = Field(None, description="Group description")


class UpdateGroupRequest(BaseModel):
    """Update group request"""
    name: Optional[str] = Field(None, description="Group name")
    description: Optional[str] = Field(None, description="Group description")


class AddMemberRequest(BaseModel):
    """Add member request"""
    user_id: int = Field(..., description="User ID to add to group")


@router.get("/", response_model=dict)
async def get_groups_endpoint(current_user: dict = Depends(get_current_user)):
    """Get all groups the user is a member of"""
    try:
        user_id = int(current_user['id'])
        groups = await get_user_groups(user_id)
        
        return {
            "success": True,
            "count": len(groups),
            "groups": groups
        }
    except Exception as e:
        logger.error(f"Error getting groups: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get groups"
        )


@router.get("/{group_id}", response_model=dict)
async def get_group_endpoint(
    group_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get group details"""
    try:
        user_id = int(current_user['id'])
        group = await get_group_by_id(group_id, user_id)
        
        if not group:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found or you are not a member"
            )
        
        return {
            "success": True,
            "group": group
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error getting group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get group"
        )


@router.post("/", response_model=dict)
async def create_group_endpoint(
    request: CreateGroupRequest,
    current_user: dict = Depends(get_current_user)
):
    """Create a new group"""
    try:
        user_id = int(current_user['id'])
        group_id = await create_group(user_id, request.name, request.description)
        
        logger.info(f"Group {group_id} created by user {user_id}")
        
        return {
            "success": True,
            "group_id": group_id,
            "message": "Group created successfully"
        }
    except Exception as e:
        logger.error(f"Error creating group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to create group"
        )


@router.patch("/{group_id}", response_model=dict)
async def update_group_endpoint(
    group_id: int,
    request: UpdateGroupRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update group (admin only)"""
    try:
        user_id = int(current_user['id'])
        success = await update_group(group_id, user_id, request.name, request.description)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found or you don't have permission"
            )
        
        return {
            "success": True,
            "message": "Group updated successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update group"
        )


@router.delete("/{group_id}", response_model=dict)
async def delete_group_endpoint(
    group_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Delete group (creator/admin only)"""
    try:
        user_id = int(current_user['id'])
        success = await delete_group(group_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Group not found or you don't have permission"
            )
        
        return {
            "success": True,
            "message": "Group deleted successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error deleting group: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to delete group"
        )


@router.get("/{group_id}/members", response_model=dict)
async def get_group_members_endpoint(
    group_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Get all members of a group"""
    try:
        user_id = int(current_user['id'])
        members = await get_group_members(group_id, user_id)
        
        return {
            "success": True,
            "count": len(members),
            "members": members
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except Exception as e:
        logger.error(f"Error getting group members: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get group members"
        )


@router.post("/{group_id}/members", response_model=dict)
async def add_group_member_endpoint(
    group_id: int,
    request: AddMemberRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a member to a group (admin only)"""
    try:
        user_id = int(current_user['id'])
        success = await add_group_member(group_id, user_id, request.user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to add member"
            )
        
        return {
            "success": True,
            "message": "Member added successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding group member: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add group member"
        )


@router.delete("/{group_id}/members/{member_user_id}", response_model=dict)
async def remove_group_member_endpoint(
    group_id: int,
    member_user_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Remove a member from a group (admin can remove, member can leave)"""
    try:
        user_id = int(current_user['id'])
        success = await remove_group_member(group_id, user_id, member_user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Member not found or you don't have permission"
            )
        
        return {
            "success": True,
            "message": "Member removed successfully"
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing group member: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove group member"
        )






