#!/usr/bin/env python3
"""
Simplified startup script for Python 3.13 compatibility
"""
import uvicorn
import os

# Set basic environment variables
os.environ.setdefault("DEBUG", "True")
os.environ.setdefault("HOST", "0.0.0.0")
os.environ.setdefault("PORT", "8000")
os.environ.setdefault("LOG_LEVEL", "INFO")

if __name__ == "__main__":
    print("🚀 Starting Location Sharing App (Python 3.13 Compatible)...")
    print("📱 Backend will be available at: http://localhost:8000")
    print("📚 API docs will be at: http://localhost:8000/docs")
    
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )









