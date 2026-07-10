"""
Simplified database connection for Python 3.13 compatibility
Uses in-memory storage instead of MongoDB for development
"""
import json
import structlog
from typing import Dict, List, Any, Optional
from datetime import datetime, timedelta

from app.core.config_simple import settings

logger = structlog.get_logger()

# In-memory storage
_memory_storage = {
    "users": {},
    "locations": {},
    "contacts": {},
    "groups": {},
    "sessions": {}
}

class SimpleDatabase:
    """Simple in-memory database replacement for MongoDB"""
    
    def __init__(self, db_name: str):
        self.db_name = db_name
        self.collections = _memory_storage
    
    def __getitem__(self, collection_name: str):
        """Get collection by name"""
        if collection_name not in self.collections:
            self.collections[collection_name] = {}
        return SimpleCollection(collection_name, self.collections[collection_name])
    
    def create_index(self, collection_name: str, index_spec: Any, **kwargs):
        """Mock index creation"""
        logger.info(f"Created index for {collection_name}: {index_spec}")
        return True

class SimpleCollection:
    """Simple collection replacement for MongoDB collections"""
    
    def __init__(self, name: str, data: Dict):
        self.name = name
        self.data = data
        self._next_id = 1
    
    def create_index(self, index_spec: Any, **kwargs):
        """Mock index creation"""
        logger.info(f"Created index for {self.name}: {index_spec}")
        return True
    
    async def insert_one(self, document: Dict) -> Dict:
        """Insert a single document"""
        doc_id = str(self._next_id)
        self._next_id += 1
        
        document["_id"] = doc_id
        document["created_at"] = datetime.utcnow().isoformat()
        self.data[doc_id] = document
        
        logger.info(f"Inserted document in {self.name}: {doc_id}")
        return {"inserted_id": doc_id}
    
    async def find_one(self, filter_dict: Dict) -> Optional[Dict]:
        """Find a single document"""
        for doc_id, doc in self.data.items():
            if self._matches_filter(doc, filter_dict):
                return doc
        return None
    
    async def find(self, filter_dict: Dict = None) -> List[Dict]:
        """Find multiple documents"""
        if filter_dict is None:
            return list(self.data.values())
        
        results = []
        for doc_id, doc in self.data.items():
            if self._matches_filter(doc, filter_dict):
                results.append(doc)
        return results
    
    async def update_one(self, filter_dict: Dict, update_dict: Dict) -> Dict:
        """Update a single document"""
        for doc_id, doc in self.data.items():
            if self._matches_filter(doc, filter_dict):
                doc.update(update_dict)
                doc["updated_at"] = datetime.utcnow().isoformat()
                logger.info(f"Updated document in {self.name}: {doc_id}")
                return {"matched_count": 1, "modified_count": 1}
        return {"matched_count": 0, "modified_count": 0}
    
    async def delete_one(self, filter_dict: Dict) -> Dict:
        """Delete a single document"""
        for doc_id, doc in self.data.items():
            if self._matches_filter(doc, filter_dict):
                del self.data[doc_id]
                logger.info(f"Deleted document in {self.name}: {doc_id}")
                return {"deleted_count": 1}
        return {"deleted_count": 0}
    
    def _matches_filter(self, doc: Dict, filter_dict: Dict) -> bool:
        """Check if document matches filter"""
        for key, value in filter_dict.items():
            if key not in doc or doc[key] != value:
                return False
        return True

# Global database instance
database: SimpleDatabase = None

async def connect_to_mongo():
    """Connect to simplified database"""
    global database
    
    try:
        database = SimpleDatabase(settings.MONGODB_DB_NAME)
        
        logger.info(
            "Connected to simplified database (in-memory)",
            database=settings.MONGODB_DB_NAME
        )
        
        # Create indexes
        await create_indexes()
        
    except Exception as e:
        logger.error(
            "Failed to connect to simplified database",
            error=str(e)
        )
        raise

async def close_mongo_connection():
    """Close database connection"""
    global database
    
    if database:
        # Clear all data
        for collection in database.collections.values():
            collection.clear()
        
        logger.info("Simplified database connection closed")

async def create_indexes():
    """Create database indexes (mock)"""
    try:
        # User collection indexes
        users_collection = database["users"]
        await users_collection.create_index("phone", unique=True)
        await users_collection.create_index("email")
        await users_collection.create_index("created_at")
        
        # Location collection indexes
        locations_collection = database["locations"]
        await locations_collection.create_index("coordinates")
        await locations_collection.create_index("user_id")
        await locations_collection.create_index("timestamp")
        await locations_collection.create_index("expires_at")
        
        # Contact collection indexes
        contacts_collection = database["contacts"]
        await contacts_collection.create_index("user_id")
        await contacts_collection.create_index("contact_id")
        
        # Group collection indexes
        groups_collection = database["groups"]
        await groups_collection.create_index("user_id")
        await groups_collection.create_index("created_at")
        
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





