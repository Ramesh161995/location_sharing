"""
MySQL database connection for the Location Sharing App
"""
import structlog
from typing import Optional
import aiomysql
from aiomysql import Pool, Connection
import os

from app.core.config_simple import settings

logger = structlog.get_logger()

# Global connection pool
pool: Optional[Pool] = None


async def connect_to_mysql():
    """Connect to MySQL database"""
    global pool
    
    try:
        # Get MySQL configuration from settings (which loads from .env)
        mysql_host = settings.MYSQL_HOST
        mysql_port = settings.MYSQL_PORT
        mysql_user = settings.MYSQL_USER
        mysql_password = settings.MYSQL_PASSWORD
        mysql_database = settings.MYSQL_DATABASE
        
        # Create connection pool
        pool = await aiomysql.create_pool(
            host=mysql_host,
            port=mysql_port,
            user=mysql_user,
            password=mysql_password,
            db=mysql_database,
            minsize=1,
            maxsize=10,
            autocommit=True,
            charset='utf8mb4'
        )
        
        # Test connection
        async with pool.acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute("SELECT 1")
                await cur.fetchone()
        
        logger.info(
            "Connected to MySQL database",
            host=mysql_host,
            port=mysql_port,
            database=mysql_database
        )
        
    except Exception as e:
        logger.error(
            "Failed to connect to MySQL database",
            error=str(e)
        )
        raise


async def close_mysql_connection():
    """Close MySQL database connection"""
    global pool
    
    if pool:
        pool.close()
        await pool.wait_closed()
        logger.info("MySQL database connection closed")
        pool = None


def get_pool() -> Pool:
    """Get MySQL connection pool"""
    if pool is None:
        raise RuntimeError("MySQL database not connected. Call connect_to_mysql() first.")
    return pool


async def get_connection() -> Connection:
    """Get a MySQL connection from the pool"""
    pool_instance = get_pool()
    return await pool_instance.acquire()


async def release_connection(conn: Connection):
    """Release a MySQL connection back to the pool"""
    pool_instance = get_pool()
    pool_instance.release(conn)


async def execute_query(query: str, params: Optional[tuple] = None):
    """Execute a query and return results"""
    async with get_pool().acquire() as conn:
        async with conn.cursor(aiomysql.DictCursor) as cur:
            await cur.execute(query, params)
            return await cur.fetchall()


async def execute_insert(query: str, params: Optional[tuple] = None):
    """Execute an INSERT query and return last insert ID"""
    async with get_pool().acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return cur.lastrowid


async def execute_update(query: str, params: Optional[tuple] = None):
    """Execute an UPDATE/DELETE query and return affected rows"""
    async with get_pool().acquire() as conn:
        async with conn.cursor() as cur:
            await cur.execute(query, params)
            return cur.rowcount

