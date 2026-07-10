#!/usr/bin/env python3
"""
Minimal startup script - bypasses all complex imports
"""
import uvicorn

if __name__ == "__main__":
    print("🚀 Starting Location Sharing App (Minimal Mode)...")
    print("📱 Backend will be available at: http://localhost:8000")
    print("📚 API docs will be at: http://localhost:8000/docs")
    
    # Run with minimal configuration
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=8000,
        reload=False,  # Disable reload to avoid import issues
        log_level="info"
    )









