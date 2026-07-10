"""
Simplified Redis connection for Python 3.13 compatibility
"""
import json
import structlog

logger = structlog.get_logger()

# Simple in-memory storage for development (replaces Redis)
_memory_storage = {}

class SimpleRedisClient:
    """Simple in-memory Redis replacement for development"""
    
    async def ping(self):
        """Mock ping"""
        return True
    
    async def set(self, key: str, value: str, ex: int = None):
        """Set value in memory"""
        _memory_storage[key] = value
        logger.info(f"Set key: {key}, value: {value}, expires: {ex}")
        return True
    
    async def get(self, key: str):
        """Get value from memory"""
        return _memory_storage.get(key)
    
    async def delete(self, key: str):
        """Delete key from memory"""
        if key in _memory_storage:
            del _memory_storage[key]
            return 1
        return 0
    
    async def close(self):
        """Mock close"""
        _memory_storage.clear()
        logger.info("Memory storage cleared")

# Global client instance
redis_client: SimpleRedisClient = None

async def connect_to_redis():
    """Connect to simplified Redis"""
    global redis_client
    try:
        redis_client = SimpleRedisClient()
        await redis_client.ping()
        logger.info("Connected to simplified Redis (in-memory)")
    except Exception as e:
        logger.error(f"Failed to connect to simplified Redis: {e}")
        raise

async def close_redis_connection():
    """Close Redis connection"""
    global redis_client
    if redis_client:
        await redis_client.close()
        logger.info("Simplified Redis connection closed")

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









