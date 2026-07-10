"""
Contacts endpoints for managing user contacts
"""
from typing import List, Optional
from fastapi import APIRouter, HTTPException, Depends, status
from pydantic import BaseModel, Field
import structlog

from app.api.v1.endpoints.auth import get_current_user
from app.services.contacts_service import (
    get_user_contacts,
    add_contact,
    remove_contact,
    update_contact,
    find_users_by_phones,
)

logger = structlog.get_logger()
router = APIRouter()


class AddContactRequest(BaseModel):
    """Add contact request"""
    contact_phone: str = Field(..., description="Contact phone number")
    contact_name: str = Field(..., description="Contact name")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_avatar: Optional[str] = Field(None, description="Contact avatar URL")


class UpdateContactRequest(BaseModel):
    """Update contact request"""
    contact_name: Optional[str] = Field(None, description="Contact name")
    contact_email: Optional[str] = Field(None, description="Contact email")
    contact_avatar: Optional[str] = Field(None, description="Contact avatar URL")
    can_share_location: Optional[bool] = Field(None, description="Can share location with this contact")


class ImportContactsRequest(BaseModel):
    """Import contacts request"""
    phones: List[str] = Field(..., description="List of phone numbers to import")


@router.get("/", response_model=dict)
async def get_contacts(current_user: dict = Depends(get_current_user)):
    """Get user's contacts"""
    try:
        user_id = int(current_user['id'])
        contacts = await get_user_contacts(user_id)
        
        return {
            "success": True,
            "count": len(contacts),
            "contacts": contacts
        }
        
    except Exception as e:
        logger.error(f"Error getting contacts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to get contacts"
        )


@router.post("/", response_model=dict)
async def create_contact(
    request: AddContactRequest,
    current_user: dict = Depends(get_current_user)
):
    """Add a new contact"""
    try:
        user_id = int(current_user['id'])
        
        # Check if contact phone is same as user's phone
        if request.contact_phone == current_user.get('phone'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot add yourself as a contact"
            )
        
        contact_id = await add_contact(
            user_id=user_id,
            contact_phone=request.contact_phone,
            contact_name=request.contact_name,
            contact_email=request.contact_email,
            contact_avatar=request.contact_avatar,
        )
        
        logger.info(f"Contact added: {contact_id} for user {user_id}")
        
        return {
            "success": True,
            "message": "Contact added successfully",
            "contact_id": contact_id
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error adding contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to add contact"
        )


@router.delete("/{contact_id}", response_model=dict)
async def delete_contact(
    contact_id: int,
    current_user: dict = Depends(get_current_user)
):
    """Remove a contact"""
    try:
        user_id = int(current_user['id'])
        success = await remove_contact(contact_id, user_id)
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        logger.info(f"Contact removed: {contact_id} for user {user_id}")
        
        return {
            "success": True,
            "message": "Contact removed successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error removing contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to remove contact"
        )


@router.patch("/{contact_id}", response_model=dict)
async def update_contact_endpoint(
    contact_id: int,
    request: UpdateContactRequest,
    current_user: dict = Depends(get_current_user)
):
    """Update contact information"""
    try:
        user_id = int(current_user['id'])
        success = await update_contact(
            contact_id=contact_id,
            user_id=user_id,
            contact_name=request.contact_name,
            contact_email=request.contact_email,
            contact_avatar=request.contact_avatar,
            can_share_location=request.can_share_location,
        )
        
        if not success:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="Contact not found"
            )
        
        return {
            "success": True,
            "message": "Contact updated successfully"
        }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error updating contact: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to update contact"
        )


@router.post("/import", response_model=dict)
async def import_contacts(
    request: ImportContactsRequest,
    current_user: dict = Depends(get_current_user)
):
    """Import contacts by phone numbers - finds existing users and adds them as contacts"""
    try:
        user_id = int(current_user['id'])
        phones = request.phones
        
        if not phones:
            return {
                "success": True,
                "message": "No phone numbers provided",
                "contacts_added": 0,
                "contacts": []
            }
        
        # Remove duplicates and current user's phone
        unique_phones = list(set(phones))
        current_user_phone = current_user.get('phone')
        unique_phones = [p for p in unique_phones if p != current_user_phone]
        
        # Find users by phone numbers
        existing_users = await find_users_by_phones(unique_phones)
        
        # Add found users as contacts
        added_contacts = []
        for user in existing_users:
            try:
                contact_id = await add_contact(
                    user_id=user_id,
                    contact_phone=user['phone'],
                    contact_name=user.get('name') or user['phone'],
                    contact_email=user.get('email'),
                    contact_avatar=user.get('avatar'),
                )
                added_contacts.append({
                    "contact_id": contact_id,
                    "user_id": user['id'],
                    "phone": user['phone'],
                    "name": user.get('name'),
                })
            except Exception as e:
                logger.warning(f"Failed to add contact {user['phone']}: {e}")
                continue
        
        logger.info(f"Imported {len(added_contacts)} contacts for user {user_id}")
        
        return {
            "success": True,
            "message": f"Imported {len(added_contacts)} contact(s)",
            "contacts_added": len(added_contacts),
            "contacts": added_contacts
        }
        
    except Exception as e:
        logger.error(f"Error importing contacts: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to import contacts"
        )


@router.get("/search/{phone}", response_model=dict)
async def search_user_by_phone(
    phone: str,
    current_user: dict = Depends(get_current_user)
):
    """Search for user by phone number (for adding contacts or tracking)"""
    try:
        # Don't allow searching for own phone
        if phone == current_user.get('phone'):
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Cannot search for your own phone number"
            )
        
        users = await find_users_by_phones([phone])
        
        if users and len(users) > 0:
            user = users[0]
            return {
                "success": True,
                "user_found": True,
                "user": {
                    "id": user['id'],
                    "phone": user['phone'],
                    "name": user.get('name'),
                    "email": user.get('email'),
                    "avatar": user.get('avatar'),
                    "is_active": user.get('is_active'),
                    "is_verified": user.get('is_verified'),
                }
            }
        else:
            return {
                "success": True,
                "user_found": False,
                "message": "User not found with this phone number"
            }
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Error searching user: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to search user"
        )
