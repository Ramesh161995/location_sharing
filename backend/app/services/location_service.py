"""
Location service for MySQL database operations
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
import structlog
import aiomysql
from decimal import Decimal

from app.core.database_mysql import get_pool

logger = structlog.get_logger()


async def save_location(
    user_id: int,
    latitude: float,
    longitude: float,
    altitude: Optional[float] = None,
    accuracy: Optional[float] = None,
    speed: Optional[float] = None,
    heading: Optional[float] = None,
    address: Optional[str] = None,
    city: Optional[str] = None,
    country: Optional[str] = None,
) -> int:
    """Save user's current location and return location ID"""
    try:
        query = """
            INSERT INTO locations 
            (user_id, latitude, longitude, altitude, accuracy, speed, heading, 
             timestamp, address, city, country, is_shared, created_at)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
        """
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:  # Use regular cursor for insert
                await cur.execute(
                    query,
                    (
                        user_id, latitude, longitude, altitude, accuracy, speed, heading,
                        now, address, city, country, False, now
                    )
                )
                return cur.lastrowid
    except Exception as e:
        logger.error(f"Error saving location: {e}")
        raise


async def get_user_current_location(user_id: int) -> Optional[Dict[str, Any]]:
    """Get user's most recent location"""
    try:
        query = """
            SELECT id, user_id, latitude, longitude, altitude, accuracy, speed, heading,
                   timestamp, address, city, country, is_shared, expires_at, created_at
            FROM locations
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT 1
        """
        
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query, (user_id,))
                row = await cur.fetchone()
                
                if row:
                    return _dict_row_to_location_dict(row)
                return None
    except Exception as e:
        logger.error(f"Error getting current location: {e}")
        raise


async def get_location_history(user_id: int, limit: int = 50) -> List[Dict[str, Any]]:
    """Get user's location history"""
    try:
        query = """
            SELECT id, user_id, latitude, longitude, altitude, accuracy, speed, heading,
                   timestamp, address, city, country, is_shared, expires_at, created_at
            FROM locations
            WHERE user_id = %s
            ORDER BY timestamp DESC
            LIMIT %s
        """
        
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query, (user_id, limit))
                rows = await cur.fetchall()
                
                return [_dict_row_to_location_dict(row) for row in rows]
    except Exception as e:
        logger.error(f"Error getting location history: {e}")
        raise


async def get_location_by_id(location_id: int) -> Optional[Dict[str, Any]]:
    """Get location by ID"""
    try:
        query = """
            SELECT id, user_id, latitude, longitude, altitude, accuracy, speed, heading,
                   timestamp, address, city, country, is_shared, expires_at, created_at
            FROM locations
            WHERE id = %s
        """
        
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                await cur.execute(query, (location_id,))
                row = await cur.fetchone()
                
                if row:
                    return _dict_row_to_location_dict(row)
                return None
    except Exception as e:
        logger.error(f"Error getting location by id: {e}")
        raise


async def share_location_with_contacts(
    location_id: int,
    contact_user_ids: List[int],
    permission_level: str = "view"
) -> bool:
    """Share a location with multiple contacts"""
    try:
        # Verify location exists
        location = await get_location_by_id(location_id)
        if not location:
            raise ValueError(f"Location {location_id} not found")
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:  # Use regular cursor for inserts
                for contact_user_id in contact_user_ids:
                    query = """
                        INSERT INTO location_shares 
                        (location_id, shared_with_user_id, permission_level, created_at)
                        VALUES (%s, %s, %s, %s)
                        ON DUPLICATE KEY UPDATE permission_level = VALUES(permission_level)
                    """
                    await cur.execute(query, (location_id, contact_user_id, permission_level, datetime.utcnow()))
                
                # Mark location as shared
                update_query = "UPDATE locations SET is_shared = TRUE WHERE id = %s"
                await cur.execute(update_query, (location_id,))
                
                return True
    except Exception as e:
        logger.error(f"Error sharing location: {e}")
        raise


async def stop_sharing_location(
    user_id: int,
    contact_user_id: int
) -> bool:
    """Stop sharing location with a specific contact"""
    try:
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                # Delete all location shares where user_id owns the location and shares with contact_user_id
                query = """
                    DELETE ls FROM location_shares ls
                    INNER JOIN locations l ON ls.location_id = l.id
                    WHERE l.user_id = %s AND ls.shared_with_user_id = %s
                """
                await cur.execute(query, (user_id, contact_user_id))
                
                # Check if there are any remaining shares for locations owned by this user
                # If not, mark locations as not shared
                check_query = """
                    SELECT DISTINCT l.id
                    FROM locations l
                    LEFT JOIN location_shares ls ON l.id = ls.location_id
                    WHERE l.user_id = %s AND l.is_shared = TRUE
                    AND ls.id IS NULL
                """
                await cur.execute(check_query, (user_id,))
                unshared_locations = await cur.fetchall()
                
                if unshared_locations:
                    # Update locations that are no longer shared
                    update_query = "UPDATE locations SET is_shared = FALSE WHERE id IN ({})".format(
                        ','.join(str(loc[0]) for loc in unshared_locations)
                    )
                    await cur.execute(update_query)
                
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error stopping location share: {e}")
        raise


async def get_contacts_user_is_sharing_with(user_id: int) -> List[int]:
    """Get list of user IDs that the current user is sharing location with"""
    try:
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                query = """
                    SELECT DISTINCT ls.shared_with_user_id
                    FROM location_shares ls
                    INNER JOIN locations l ON ls.location_id = l.id
                    WHERE l.user_id = %s
                """
                await cur.execute(query, (user_id,))
                rows = await cur.fetchall()
                return [int(row[0]) for row in rows] if rows else []
    except Exception as e:
        logger.error(f"Error getting contacts user is sharing with: {e}")
        raise


async def get_shared_locations(user_id: int) -> List[Dict[str, Any]]:
    """Get locations shared with the user - returns the LATEST location for each shared user (live sharing)"""
    try:
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                # Step 1: Get all distinct users who are sharing with this user
                sharing_users_query = """
                    SELECT DISTINCT l.user_id as sharing_user_id
                    FROM location_shares ls
                    JOIN locations l ON ls.location_id = l.id
                    WHERE ls.shared_with_user_id = %s
                """
                await cur.execute(sharing_users_query, (user_id,))
                sharing_users = await cur.fetchall()
                
                if not sharing_users:
                    return []
                
                sharing_user_ids = [int(row['sharing_user_id']) for row in sharing_users]
                
                # Step 2: For each sharing user, get their latest location and share metadata
                results = []
                for sharing_user_id in sharing_user_ids:
                    # Get latest location for this user
                    latest_location_query = """
                        SELECT id, user_id, latitude, longitude, altitude, accuracy, 
                               speed, heading, timestamp, address, city, country, 
                               is_shared, expires_at, created_at
                        FROM locations
                        WHERE user_id = %s
                        AND (expires_at IS NULL OR expires_at > %s)
                        ORDER BY timestamp DESC
                        LIMIT 1
                    """
                    await cur.execute(latest_location_query, (sharing_user_id, now))
                    latest_location = await cur.fetchone()
                    
                    if not latest_location:
                        continue
                    
                    # Get share metadata (permission_level, shared_at) - use any share record for this user
                    share_meta_query = """
                        SELECT ls.permission_level, ls.created_at as shared_at
                        FROM location_shares ls
                        JOIN locations l ON ls.location_id = l.id
                        WHERE ls.shared_with_user_id = %s
                        AND l.user_id = %s
                        ORDER BY ls.created_at DESC
                        LIMIT 1
                    """
                    await cur.execute(share_meta_query, (user_id, sharing_user_id))
                    share_meta = await cur.fetchone()
                    
                    # Get owner info
                    owner_query = "SELECT name, phone FROM users WHERE id = %s"
                    await cur.execute(owner_query, (sharing_user_id,))
                    owner = await cur.fetchone()
                    
                    # Combine all data
                    combined = {
                        **latest_location,
                        'permission_level': share_meta['permission_level'] if share_meta else 'view',
                        'shared_at': share_meta['shared_at'].isoformat() if share_meta and share_meta.get('shared_at') else datetime.utcnow().isoformat(),
                        'owner_name': owner['name'] if owner else None,
                        'owner_phone': owner['phone'] if owner else None,
                    }
                    results.append(combined)
                
                # Convert to proper format
                return [_dict_row_to_shared_location_dict(row) for row in results]
    except Exception as e:
        logger.error(f"Error getting shared locations: {e}")
        raise


def _dict_row_to_location_dict(row: dict) -> Dict[str, Any]:
    """Convert database row dict to location dictionary"""
    location_dict = row.copy()
    
    for key, value in location_dict.items():
        if isinstance(value, Decimal):
            location_dict[key] = float(value)
        elif isinstance(value, datetime):
            location_dict[key] = value.isoformat()
    
    location_dict['id'] = str(location_dict['id'])
    location_dict['user_id'] = str(location_dict['user_id'])
    
    return location_dict


def _dict_row_to_shared_location_dict(row: dict) -> Dict[str, Any]:
    """Convert database row dict to shared location dictionary"""
    location_dict = row.copy()
    
    for key, value in location_dict.items():
        if isinstance(value, Decimal):
            location_dict[key] = float(value)
        elif isinstance(value, datetime):
            location_dict[key] = value.isoformat()
    
    location_dict['id'] = str(location_dict['id'])
    location_dict['user_id'] = str(location_dict['user_id'])
    
    return location_dict

