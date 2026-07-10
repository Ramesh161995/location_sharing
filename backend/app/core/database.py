"""
Database connection and configuration for MongoDB
"""
from motor.motor_asyncio import AsyncIOMotorClient
from pymongo.errors import ConnectionFailure
import structlog

from app.core.config_simple import settings

logger = structlog.get_logger()

# Global database client
client: AsyncIOMotorClient = None
database = None


async def connect_to_mongo():
    """Connect to MongoDB"""
    global client, database
    
    try:
        # Create MongoDB client
        client = AsyncIOMotorClient(
            settings.MONGODB_URL,
            maxPoolSize=settings.MONGODB_MAX_POOL_SIZE,
            serverSelectionTimeoutMS=5000,
        )
        
        # Test connection
        await client.admin.command('ping')
        
        # Get database
        database = client[settings.MONGODB_DB_NAME]
        
        logger.info(
            "Connected to MongoDB",
            url=settings.MONGODB_URL,
            database=settings.MONGODB_DB_NAME
        )
        
        # Create indexes
        await create_indexes()
        
    except ConnectionFailure as e:
        logger.error(
            "Failed to connect to MongoDB",
            error=str(e),
            url=settings.MONGODB_URL
        )
        raise
    except Exception as e:
        logger.error(
            "Unexpected error connecting to MongoDB",
            error=str(e)
        )
        raise


async def close_mongo_connection():
    """Close MongoDB connection"""
    global client
    
    if client:
        client.close()
        logger.info("MongoDB connection closed")


async def create_indexes():
    """Create database indexes"""
    try:
        # User collection indexes
        await database.users.create_index("phone", unique=True)
        await database.users.create_index("email")
        await database.users.create_index("created_at")
        
        # Location collection indexes
        await database.locations.create_index([("coordinates", "2dsphere")])
        await database.locations.create_index("user_id")
        await database.locations.create_index("timestamp")
        await database.locations.create_index("expires_at")
        
        # Contact collection indexes
        await database.contacts.create_index([("user_id", 1), ("contact_id", 1)], unique=True)
        await database.contacts.create_index("user_id")
        
        # Group collection indexes
        await database.groups.create_index("user_id")
        await database.groups.create_index("created_at")
        
        logger.info("Database indexes created successfully")
        
    except Exception as e:
        logger.error(
            "Failed to create database indexes",
            error=str(e)
        )


def get_database():
    """Get database instance"""
    return database


def get_collection(collection_name: str):
    """Get collection instance"""
    if not database:
        raise RuntimeError("Database not connected")
    return database[collection_name]
