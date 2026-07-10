"""
Contacts service for MySQL database operations
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
import structlog
import aiomysql

from app.core.database_mysql import get_pool

logger = structlog.get_logger()


async def add_contact(
    user_id: int,
    contact_phone: str,
    contact_name: str,
    contact_email: Optional[str] = None,
    contact_avatar: Optional[str] = None,
) -> int:
    """Add a contact to user's contact list"""
    try:
        query = """
            INSERT INTO contacts 
            (user_id, contact_phone, contact_name, contact_email, contact_avatar, 
             is_online, can_share_location, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s)
            ON DUPLICATE KEY UPDATE 
                contact_name = VALUES(contact_name),
                contact_email = VALUES(contact_email),
                contact_avatar = VALUES(contact_avatar),
                updated_at = VALUES(updated_at)
        """
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:  # Use regular cursor for insert
                await cur.execute(
                    query,
                    (user_id, contact_phone, contact_name, contact_email, contact_avatar, False, True, now, now)
                )
                return cur.lastrowid
    except Exception as e:
        logger.error(f"Error adding contact: {e}")
        raise


async def get_user_contacts(user_id: int) -> List[Dict[str, Any]]:
    """Get all contacts for a user"""
    try:
        query = """
            SELECT c.id, c.user_id, c.contact_phone, c.contact_name, c.contact_email,
                   c.contact_avatar, c.is_online, c.can_share_location, 
                   c.created_at, c.updated_at,
                   u.id as user_account_id, u.name as user_account_name, 
                   u.avatar as user_account_avatar, u.is_active as user_account_active
            FROM contacts c
            LEFT JOIN users u ON c.contact_phone = u.phone
            WHERE c.user_id = %s
            ORDER BY c.contact_name ASC
        """
        
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query, (user_id,))
                rows = await cur.fetchall()
                
                return [_dict_row_to_contact_dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Error getting contacts: {e}")
        raise


async def remove_contact(contact_id: int, user_id: int) -> bool:
    """Remove a contact from user's contact list"""
    try:
        query = "DELETE FROM contacts WHERE id = %s AND user_id = %s"
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:  # Use regular cursor for delete
                await cur.execute(query, (contact_id, user_id))
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error removing contact: {e}")
        raise


async def update_contact(
    contact_id: int,
    user_id: int,
    contact_name: Optional[str] = None,
    contact_email: Optional[str] = None,
    contact_avatar: Optional[str] = None,
    can_share_location: Optional[bool] = None,
) -> bool:
    """Update contact information"""
    try:
        updates = []
        params = []
        
        if contact_name is not None:
            updates.append("contact_name = %s")
            params.append(contact_name)
        if contact_email is not None:
            updates.append("contact_email = %s")
            params.append(contact_email)
        if contact_avatar is not None:
            updates.append("contact_avatar = %s")
            params.append(contact_avatar)
        if can_share_location is not None:
            updates.append("can_share_location = %s")
            params.append(can_share_location)
        
        if not updates:
            return True
        
        updates.append("updated_at = %s")
        params.append(datetime.utcnow())
        params.extend([contact_id, user_id])
        
        query = f"UPDATE contacts SET {', '.join(updates)} WHERE id = %s AND user_id = %s"
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:  # Use regular cursor for update
                await cur.execute(query, params)
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating contact: {e}")
        raise


async def find_users_by_phones(phones: List[str]) -> List[Dict[str, Any]]:
    """Find users by phone numbers (for importing contacts)"""
    try:
        if not phones:
            return []
        
        placeholders = ','.join(['%s'] * len(phones))
        query = f"""
            SELECT id, phone, name, email, avatar, is_active, is_verified
            FROM users
            WHERE phone IN ({placeholders})
        """
        
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query, phones)
                rows = await cur.fetchall()
                
                return [_dict_row_to_user_dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Error finding users by phones: {e}")
        raise


def _dict_row_to_contact_dict(row: dict) -> Dict[str, Any]:
    """Convert database row dict to contact dictionary"""
    contact_dict = row.copy()
    
    for key, value in contact_dict.items():
        if isinstance(value, datetime):
            contact_dict[key] = value.isoformat()
    
    contact_dict['id'] = str(contact_dict['id'])
    contact_dict['user_id'] = str(contact_dict['user_id'])
    if contact_dict.get('user_account_id'):
        contact_dict['user_account_id'] = str(contact_dict['user_account_id'])
    
    return contact_dict


def _dict_row_to_user_dict(row: dict) -> Dict[str, Any]:
    """Convert database row dict to user dictionary (for contact import)"""
    user_dict = row.copy()
    
    for key, value in user_dict.items():
        if isinstance(value, datetime):
            user_dict[key] = value.isoformat()
    
    user_dict['id'] = str(user_dict['id'])
    
    return user_dict

