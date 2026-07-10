"""
Authentication endpoints for phone-based login with MySQL
"""
from datetime import datetime, timedelta
from typing import Optional
from fastapi import APIRouter, HTTPException, Depends, status
from fastapi.security import HTTPBearer
from jose import JWTError, jwt
import structlog
from pydantic import BaseModel, Field

from app.core.config_simple import settings
from app.services.user_service import get_user_by_phone, get_user_by_id, create_user, update_user_last_seen, update_user_name
from app.services.otp_service import generate_and_store_otp, verify_otp as verify_otp_service

logger = structlog.get_logger()
router = APIRouter()
security = HTTPBearer()


class PhoneAuthRequest(BaseModel):
    """Phone authentication request"""
    phone: str = Field(..., description="Phone number")


class OTPVerificationRequest(BaseModel):
    """OTP verification request"""
    phone: str = Field(..., description="Phone number")
    otp: str = Field(..., description="OTP code")
    name: Optional[str] = Field(default=None, description="User full name (optional, for new users)")


class TokenResponse(BaseModel):
    """Token response"""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int
    user: Optional[dict] = None


class RefreshTokenRequest(BaseModel):
    """Refresh token request"""
    refresh_token: str = Field(..., description="Refresh token")


def create_access_token(data: dict, expires_delta: Optional[timedelta] = None):
    """Create JWT access token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


def create_refresh_token(data: dict):
    """Create JWT refresh token"""
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, settings.SECRET_KEY, algorithm=settings.ALGORITHM)
    return encoded_jwt


async def get_current_user(token: str = Depends(security)):
    """Get current authenticated user"""
    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )
    
    try:
        payload = jwt.decode(token.credentials, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception
    except JWTError:
        raise credentials_exception
    
    # Get user from database
    try:
        user = await get_user_by_id(int(user_id))
        if user is None:
            raise credentials_exception
        return user
    except ValueError:
        raise credentials_exception
    except Exception as e:
        logger.error(f"Error getting current user: {e}")
        raise credentials_exception


@router.post("/request-otp", response_model=dict)
async def request_otp(request: PhoneAuthRequest):
    """Request OTP for phone authentication"""
    try:
        phone = request.phone
        
        # Generate and store OTP in database
        otp = await generate_and_store_otp(phone, expires_in_minutes=5)
        
        logger.info(f"OTP requested for phone: {phone}")
        
        # In production, send SMS here using Twilio or similar service
        # For development, return OTP in response
        return {
            "message": "OTP sent successfully",
            "phone": phone,
            "otp": otp,  # Remove this in production - only for development
            "expires_in": 300
        }
        
    except Exception as e:
        logger.error(f"Failed to request OTP: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to send OTP"
        )


@router.post("/verify-otp", response_model=TokenResponse)
async def verify_otp(request: OTPVerificationRequest):
    """Verify OTP and authenticate user"""
    try:
        phone = request.phone
        otp_code = request.otp
        
        # Verify OTP from database
        is_valid = await verify_otp_service(phone, otp_code)
        
        if not is_valid:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Invalid or expired OTP"
            )
        
        # Check if user exists
        user = await get_user_by_phone(phone)
        
        if not user:
            # Create new user with provided name (or default)
            user_id = await create_user(phone, name=request.name)
            user = await get_user_by_id(user_id)
            logger.info(f"New user created: {user_id} with name: {request.name or 'default'}")
        else:
            user_id = int(user['id'])
            # Update last seen
            await update_user_last_seen(user_id)
            # Update name if provided and different from current name
            if request.name and request.name.strip():
                current_name = user.get('name', '').strip()
                new_name = request.name.strip()
                if new_name != current_name:
                    await update_user_name(user_id, new_name)
                    logger.info(f"User {user_id} name updated from '{current_name}' to '{new_name}'")
            # Refresh user data
            user = await get_user_by_id(user_id)
        
        # Create tokens
        access_token = create_access_token(data={"sub": str(user_id)})
        refresh_token = create_refresh_token(data={"sub": str(user_id)})
        
        logger.info(f"User authenticated: {user_id}")
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error(f"Failed to verify OTP: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to verify OTP"
        )


@router.get("/check-phone/{phone}", response_model=dict)
async def check_phone(phone: str):
    """Check if phone number exists and return user name if available"""
    try:
        user = await get_user_by_phone(phone)
        if user:
            return {
                "exists": True,
                "name": user.get('name')
            }
        else:
            return {
                "exists": False,
                "name": None
            }
    except Exception as e:
        logger.error(f"Error checking phone: {e}", exc_info=True)
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to check phone number"
        )


@router.post("/refresh", response_model=TokenResponse)
async def refresh_token_endpoint(request: RefreshTokenRequest):
    """Refresh access token using refresh token"""
    try:
        payload = jwt.decode(request.refresh_token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        user_id: str = payload.get("sub")
        
        if user_id is None:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid refresh token"
            )
        
        # Verify user still exists
        user = await get_user_by_id(int(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="User not found"
            )
        
        # Create new access token
        access_token = create_access_token(data={"sub": user_id})
        
        return TokenResponse(
            access_token=access_token,
            refresh_token=request.refresh_token,
            expires_in=settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60,
            user=user
        )
        
    except JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid refresh token"
        )


@router.post("/logout")
async def logout(current_user: dict = Depends(get_current_user)):
    """Logout user and invalidate tokens"""
    try:
        # In production, add tokens to blacklist
        logger.info(f"User logged out: {current_user.get('id')}")
        
        return {"message": "Logged out successfully"}
        
    except Exception as e:
        logger.error(f"Failed to logout: {e}")
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to logout"
        )


@router.get("/me", response_model=dict)
async def get_current_user_info(current_user: dict = Depends(get_current_user)):
    """Get current user information"""
    return current_user
