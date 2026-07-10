"""
User service for MySQL database operations
"""
from datetime import datetime, timedelta
from typing import Optional, Dict, Any
import structlog
import json
import aiomysql

from app.core.database_mysql import get_pool

logger = structlog.get_logger()


async def get_user_by_phone(phone: str) -> Optional[Dict[str, Any]]:
    """Get user by phone number"""
    try:
        query = """
            SELECT id, phone, name, email, avatar, 
                   privacy_level, share_location, notifications, theme, language, timezone,
                   subscription_plan, subscription_expires_at, subscription_features,
                   is_verified, is_active, last_seen, created_at, updated_at
            FROM users 
            WHERE phone = %s
        """
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query, (phone,))
                row = await cur.fetchone()
                
                if row:
                    return await _row_to_user_dict_dictcursor(cur, row)
                return None
    except Exception as e:
        logger.error(f"Error getting user by phone: {e}")
        raise


async def get_user_by_id(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user by ID"""
    try:
        query = """
            SELECT id, phone, name, email, avatar, 
                   privacy_level, share_location, notifications, theme, language, timezone,
                   subscription_plan, subscription_expires_at, subscription_features,
                   is_verified, is_active, last_seen, created_at, updated_at
            FROM users 
            WHERE id = %s
        """
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query, (user_id,))
                row = await cur.fetchone()
                
                if row:
                    return await _row_to_user_dict_dictcursor(cur, row)
                return None
    except Exception as e:
        logger.error(f"Error getting user by id: {e}")
        raise


async def create_user(phone: str, name: Optional[str] = None) -> int:
    """Create a new user and return user ID"""
    try:
        if not name:
            name = f"User_{phone[-4:]}"
        
        query = """
            INSERT INTO users (phone, name, is_verified, created_at, updated_at)
            VALUES (%s, %s, %s, %s, %s)
        """
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (phone, name, True, now, now))
                return cur.lastrowid
    except Exception as e:
        logger.error(f"Error creating user: {e}")
        raise


async def update_user_last_seen(user_id: int):
    """Update user's last seen timestamp"""
    try:
        query = "UPDATE users SET last_seen = %s, updated_at = %s WHERE id = %s"
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (now, now, user_id))
    except Exception as e:
        logger.error(f"Error updating user last seen: {e}")
        raise


async def update_user_name(user_id: int, name: str):
    """Update user's name"""
    try:
        query = "UPDATE users SET name = %s, updated_at = %s WHERE id = %s"
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (name, now, user_id))
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating user name: {e}")
        raise


async def update_user_settings(
    user_id: int,
    privacy_level: Optional[str] = None,
    share_location: Optional[bool] = None,
    notifications: Optional[bool] = None,
    theme: Optional[str] = None
):
    """Update user settings"""
    try:
        updates = []
        params = []
        
        if privacy_level is not None:
            updates.append("privacy_level = %s")
            params.append(privacy_level)
        if share_location is not None:
            updates.append("share_location = %s")
            params.append(share_location)
        if notifications is not None:
            updates.append("notifications = %s")
            params.append(notifications)
        if theme is not None:
            updates.append("theme = %s")
            params.append(theme)
        
        if not updates:
            return True
        
        updates.append("updated_at = %s")
        params.append(datetime.utcnow())
        params.append(user_id)
        
        query = f"UPDATE users SET {', '.join(updates)} WHERE id = %s"
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, params)
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating user settings: {e}")
        raise


async def _row_to_user_dict_dictcursor(cursor, row: dict) -> Dict[str, Any]:
    """Convert database row (DictCursor) to user dictionary"""
    user_dict = row.copy()
    
    # Handle JSON fields
    if 'subscription_features' in user_dict and user_dict['subscription_features']:
        if isinstance(user_dict['subscription_features'], str):
            user_dict['subscription_features'] = json.loads(user_dict['subscription_features'])
    
    # Convert datetime to ISO format string
    for key, value in user_dict.items():
        if isinstance(value, datetime):
            user_dict[key] = value.isoformat()
    
    # Format for API response (convert id to string for consistency)
    user_dict['id'] = str(user_dict['id'])
    user_dict['_id'] = user_dict['id']  # Add _id for backward compatibility
    
    # Extract and format settings
    settings_dict = {
        'privacy_level': user_dict.pop('privacy_level', 'private'),
        'share_location': bool(user_dict.pop('share_location', False)),
        'notifications': bool(user_dict.pop('notifications', True)),
        'theme': user_dict.pop('theme', 'light'),
        'language': user_dict.pop('language', 'en'),
        'timezone': user_dict.pop('timezone', 'UTC')
    }
    
    # Extract and format subscription
    expires_at = user_dict.pop('subscription_expires_at', None)
    if expires_at and isinstance(expires_at, str):
        # Already converted to ISO string
        pass
    elif expires_at:
        expires_at = expires_at.isoformat()
    
    subscription_dict = {
        'plan': user_dict.pop('subscription_plan', 'free'),
        'expires_at': expires_at,
        'features': user_dict.pop('subscription_features', [])
    }
    
    # Add formatted settings and subscription
    user_dict['settings'] = settings_dict
    user_dict['subscription'] = subscription_dict
    
    return user_dict

