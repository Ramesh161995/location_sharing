"""
Redis connection and configuration
"""
import aioredis
import structlog

from app.core.config import settings

logger = structlog.get_logger()

# Global Redis client
redis_client: aioredis.Redis = None


async def connect_to_redis():
    """Connect to Redis"""
    global redis_client
    
    try:
        # Create Redis client
        redis_client = aioredis.from_url(
            settings.REDIS_URL,
            db=settings.REDIS_DB,
            max_connections=settings.REDIS_MAX_CONNECTIONS,
            encoding="utf-8",
            decode_responses=True
        )
        
        # Test connection
        await redis_client.ping()
        
        logger.info(
            "Connected to Redis",
            url=settings.REDIS_URL,
            db=settings.REDIS_DB
        )
        
    except Exception as e:
        logger.error(
            "Failed to connect to Redis",
            error=str(e),
            url=settings.REDIS_URL
        )
        raise


async def close_redis_connection():
    """Close Redis connection"""
    global redis_client
    
    if redis_client:
        await redis_client.close()
        logger.info("Redis connection closed")


def get_redis():
    """Get Redis client instance"""
    if not redis_client:
        raise RuntimeError("Redis not connected")
    return redis_client


async def set_cache(key: str, value: str, expire: int = 3600):
    """Set cache value"""
    try:
        await redis_client.set(key, value, ex=expire)
        return True
    except Exception as e:
        logger.error(f"Failed to set cache: {e}")
        return False


async def get_cache(key: str):
    """Get cache value"""
    try:
        return await redis_client.get(key)
    except Exception as e:
        logger.error(f"Failed to get cache: {e}")
        return None


async def delete_cache(key: str):
    """Delete cache value"""
    try:
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Failed to delete cache: {e}")
        return False


async def set_user_session(user_id: str, session_data: dict, expire: int = 86400):
    """Set user session data"""
    key = f"session:{user_id}"
    try:
        await redis_client.set(key, str(session_data), ex=expire)
        return True
    except Exception as e:
        logger.error(f"Failed to set user session: {e}")
        return False


async def get_user_session(user_id: str):
    """Get user session data"""
    key = f"session:{user_id}"
    try:
        return await redis_client.get(key)
    except Exception as e:
        logger.error(f"Failed to get user session: {e}")
        return None


async def delete_user_session(user_id: str):
    """Delete user session data"""
    key = f"session:{user_id}"
    try:
        await redis_client.delete(key)
        return True
    except Exception as e:
        logger.error(f"Failed to delete user session: {e}")
        return False









