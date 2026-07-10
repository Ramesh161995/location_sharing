"""
OTP service for MySQL database operations
"""
from datetime import datetime, timedelta
from typing import Optional
import random
import structlog

from app.core.database_mysql import get_pool

logger = structlog.get_logger()


async def generate_and_store_otp(phone: str, expires_in_minutes: int = 5) -> str:
    """Generate OTP and store it in database"""
    try:
        # Generate 6-digit OTP
        otp = str(random.randint(100000, 999999))
        
        # Calculate expiration time
        expires_at = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        
        # Store OTP in database
        query = """
            INSERT INTO otp_sessions (phone, otp_code, expires_at, attempts, is_used, created_at)
            VALUES (%s, %s, %s, %s, %s, %s)
        """
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (phone, otp, expires_at, 0, False, now))
        
        logger.info(f"OTP generated and stored for phone: {phone}")
        return otp
        
    except Exception as e:
        logger.error(f"Error generating OTP: {e}")
        raise


async def verify_otp(phone: str, otp: str) -> bool:
    """Verify OTP and mark as used if valid"""
    try:
        query = """
            SELECT id, otp_code, expires_at, attempts, is_used
            FROM otp_sessions
            WHERE phone = %s 
            AND is_used = FALSE
            AND expires_at > %s
            ORDER BY created_at DESC
            LIMIT 1
        """
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (phone, now))
                row = await cur.fetchone()
                
                if not row:
                    logger.warning(f"No valid OTP found for phone: {phone}")
                    return False
                
                otp_id, stored_otp, expires_at, attempts, is_used = row
                
                # Check if OTP matches
                if stored_otp != otp:
                    # Increment attempts
                    update_query = "UPDATE otp_sessions SET attempts = attempts + 1 WHERE id = %s"
                    await cur.execute(update_query, (otp_id,))
                    logger.warning(f"Invalid OTP attempt for phone: {phone}")
                    return False
                
                # Mark OTP as used
                mark_used_query = "UPDATE otp_sessions SET is_used = TRUE WHERE id = %s"
                await cur.execute(mark_used_query, (otp_id,))
                
                logger.info(f"OTP verified successfully for phone: {phone}")
                return True
                
    except Exception as e:
        logger.error(f"Error verifying OTP: {e}")
        raise


async def cleanup_expired_otps():
    """Clean up expired OTPs (can be called periodically)"""
    try:
        query = "DELETE FROM otp_sessions WHERE expires_at < %s"
        now = datetime.utcnow()
        
        async with get_pool().acquire() as conn:
            async with conn.cursor() as cur:
                await cur.execute(query, (now,))
                deleted = cur.rowcount
                
        logger.info(f"Cleaned up {deleted} expired OTPs")
        
    except Exception as e:
        logger.error(f"Error cleaning up expired OTPs: {e}")

