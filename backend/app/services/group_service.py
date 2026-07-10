"""
Group service for MySQL database operations
"""
from datetime import datetime
from typing import Optional, List, Dict, Any
import structlog
import aiomysql

from app.core.database_mysql import get_pool

logger = structlog.get_logger()


async def create_group(
    user_id: int,
    name: str,
    description: Optional[str] = None
) -> int:
    """Create a new group and add creator as admin member"""
    try:
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                # Create group
                group_query = """
                    INSERT INTO `groups` (name, description, created_by_user_id, created_at, updated_at)
                    VALUES (%s, %s, %s, %s, %s)
                """
                now = datetime.utcnow()
                await cur.execute(group_query, (name, description, user_id, now, now))
                group_id = cur.lastrowid
                
                # Add creator as admin member
                member_query = """
                    INSERT INTO group_members (group_id, user_id, role, joined_at)
                    VALUES (%s, %s, %s, %s)
                """
                await cur.execute(member_query, (group_id, user_id, 'admin', now))
                
                return group_id
    except Exception as e:
        logger.error(f"Error creating group: {e}")
        raise


async def get_user_groups(user_id: int) -> List[Dict[str, Any]]:
    """Get all groups the user is a member of"""
    try:
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                query = """
                    SELECT g.id, g.name, g.description, g.created_by_user_id, g.created_at, g.updated_at,
                           gm.role, gm.joined_at,
                           u.name as creator_name, u.phone as creator_phone,
                           (SELECT COUNT(*) FROM group_members WHERE group_id = g.id) as member_count
                    FROM group_members gm
                    INNER JOIN `groups` g ON gm.group_id = g.id
                    LEFT JOIN users u ON g.created_by_user_id = u.id
                    WHERE gm.user_id = %s
                    ORDER BY g.created_at DESC
                """
                await cur.execute(query, (user_id,))
                rows = await cur.fetchall()
                
                groups = []
                for row in rows:
                    group_dict = {
                        'id': str(row['id']),
                        'name': row['name'],
                        'description': row['description'],
                        'created_by_user_id': str(row['created_by_user_id']),
                        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                        'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
                        'role': row['role'],
                        'joined_at': row['joined_at'].isoformat() if row['joined_at'] else None,
                        'creator_name': row['creator_name'],
                        'creator_phone': row['creator_phone'],
                        'member_count': int(row['member_count']) if row['member_count'] else 0,
                    }
                    groups.append(group_dict)
                
                return groups
    except Exception as e:
        logger.error(f"Error getting user groups: {e}")
        raise


async def get_group_by_id(group_id: int, user_id: int) -> Optional[Dict[str, Any]]:
    """Get group details if user is a member"""
    try:
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                query = """
                    SELECT g.id, g.name, g.description, g.created_by_user_id, g.created_at, g.updated_at,
                           gm.role, gm.joined_at,
                           u.name as creator_name, u.phone as creator_phone
                    FROM `groups` g
                    INNER JOIN group_members gm ON g.id = gm.group_id
                    LEFT JOIN users u ON g.created_by_user_id = u.id
                    WHERE g.id = %s AND gm.user_id = %s
                """
                await cur.execute(query, (group_id, user_id))
                row = await cur.fetchone()
                
                if row:
                    return {
                        'id': str(row['id']),
                        'name': row['name'],
                        'description': row['description'],
                        'created_by_user_id': str(row['created_by_user_id']),
                        'created_at': row['created_at'].isoformat() if row['created_at'] else None,
                        'updated_at': row['updated_at'].isoformat() if row['updated_at'] else None,
                        'role': row['role'],
                        'joined_at': row['joined_at'].isoformat() if row['joined_at'] else None,
                        'creator_name': row['creator_name'],
                        'creator_phone': row['creator_phone'],
                    }
                return None
    except Exception as e:
        logger.error(f"Error getting group by id: {e}")
        raise


async def update_group(
    group_id: int,
    user_id: int,
    name: Optional[str] = None,
    description: Optional[str] = None
) -> bool:
    """Update group (only admin can update)"""
    try:
        # Check if user is admin
        group = await get_group_by_id(group_id, user_id)
        if not group or group['role'] != 'admin':
            raise ValueError("Only group admins can update the group")
        
        updates = []
        params = []
        
        if name is not None:
            updates.append("name = %s")
            params.append(name)
        if description is not None:
            updates.append("description = %s")
            params.append(description)
        
        if not updates:
            return True
        
        updates.append("updated_at = %s")
        params.append(datetime.utcnow())
        params.append(group_id)
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                query = f"UPDATE `groups` SET {', '.join(updates)} WHERE id = %s"
                await cur.execute(query, params)
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error updating group: {e}")
        raise


async def delete_group(group_id: int, user_id: int) -> bool:
    """Delete group (only creator/admin can delete)"""
    try:
        # Check if user is creator or admin
        group = await get_group_by_id(group_id, user_id)
        if not group:
            raise ValueError("Group not found or user is not a member")
        
        if group['created_by_user_id'] != str(user_id) and group['role'] != 'admin':
            raise ValueError("Only group creator or admin can delete the group")
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                # Delete group (cascade will delete members)
                query = "DELETE FROM `groups` WHERE id = %s"
                await cur.execute(query, (group_id,))
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error deleting group: {e}")
        raise


async def get_group_members(group_id: int, user_id: int) -> List[Dict[str, Any]]:
    """Get all members of a group (user must be a member)"""
    try:
        # Verify user is a member
        group = await get_group_by_id(group_id, user_id)
        if not group:
            raise ValueError("User is not a member of this group")
        
        async with get_pool().acquire() as conn:
            async with conn.cursor(aiomysql.DictCursor) as cur:
                query = """
                    SELECT gm.id, gm.group_id, gm.user_id, gm.role, gm.joined_at,
                           u.name, u.phone, u.avatar, u.is_active, u.last_seen
                    FROM group_members gm
                    INNER JOIN users u ON gm.user_id = u.id
                    WHERE gm.group_id = %s
                    ORDER BY gm.role DESC, gm.joined_at ASC
                """
                await cur.execute(query, (group_id,))
                rows = await cur.fetchall()
                
                members = []
                for row in rows:
                    member_dict = {
                        'id': str(row['id']),
                        'group_id': str(row['group_id']),
                        'user_id': str(row['user_id']),
                        'role': row['role'],
                        'joined_at': row['joined_at'].isoformat() if row['joined_at'] else None,
                        'name': row['name'],
                        'phone': row['phone'],
                        'avatar': row['avatar'],
                        'is_active': bool(row['is_active']),
                        'last_seen': row['last_seen'].isoformat() if row['last_seen'] else None,
                    }
                    members.append(member_dict)
                
                return members
    except Exception as e:
        logger.error(f"Error getting group members: {e}")
        raise


async def add_group_member(
    group_id: int,
    user_id: int,  # User adding the member
    new_member_user_id: int  # User being added
) -> bool:
    """Add a member to a group (only admin can add)"""
    try:
        # Check if user is admin
        group = await get_group_by_id(group_id, user_id)
        if not group or group['role'] != 'admin':
            raise ValueError("Only group admins can add members")
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                # Check if member already exists
                check_query = "SELECT id FROM group_members WHERE group_id = %s AND user_id = %s"
                await cur.execute(check_query, (group_id, new_member_user_id))
                if await cur.fetchone():
                    raise ValueError("User is already a member of this group")
                
                # Add member
                query = """
                    INSERT INTO group_members (group_id, user_id, role, joined_at)
                    VALUES (%s, %s, %s, %s)
                """
                await cur.execute(query, (group_id, new_member_user_id, 'member', datetime.utcnow()))
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error adding group member: {e}")
        raise


async def remove_group_member(
    group_id: int,
    user_id: int,  # User removing the member
    member_user_id: int  # User being removed
) -> bool:
    """Remove a member from a group (admin can remove, or member can leave)"""
    try:
        # Check if user is admin or is removing themselves
        group = await get_group_by_id(group_id, user_id)
        if not group:
            raise ValueError("User is not a member of this group")
        
        if member_user_id != user_id and group['role'] != 'admin':
            raise ValueError("Only group admins can remove other members")
        
        # Prevent removing the last admin
        if member_user_id != user_id:
            members = await get_group_members(group_id, user_id)
            admin_count = sum(1 for m in members if m['role'] == 'admin')
            target_member = next((m for m in members if m['user_id'] == str(member_user_id)), None)
            if target_member and target_member['role'] == 'admin' and admin_count <= 1:
                raise ValueError("Cannot remove the last admin of the group")
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                query = "DELETE FROM group_members WHERE group_id = %s AND user_id = %s"
                await cur.execute(query, (group_id, member_user_id))
                return cur.rowcount > 0
    except Exception as e:
        logger.error(f"Error removing group member: {e}")
        raise

