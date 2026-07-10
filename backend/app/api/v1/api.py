"""
Main API router for v1 endpoints
"""
from fastapi import APIRouter

from app.api.v1.endpoints import auth, users, location, contacts, groups

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(auth.router, prefix="/auth", tags=["authentication"])
api_router.include_router(users.router, prefix="/users", tags=["users"])
api_router.include_router(location.router, prefix="/location", tags=["location"])
api_router.include_router(contacts.router, prefix="/contacts", tags=["contacts"])
api_router.include_router(groups.router, prefix="/groups", tags=["groups"])






