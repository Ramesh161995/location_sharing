#!/usr/bin/env python3
"""
Simple startup script for the Location Sharing App backend
"""
import uvicorn
from app.core.config_simple import settings

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host=settings.HOST,
        port=settings.PORT,
        reload=settings.DEBUG,
        log_level=settings.LOG_LEVEL.lower()
    )






