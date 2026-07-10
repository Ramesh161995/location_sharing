#!/usr/bin/env python3
"""
Super simple startup script - minimal FastAPI server without complex dependencies
"""
import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

# Create a minimal FastAPI app
app = FastAPI(
    title="Location Sharing App API",
    description="A simple location sharing application",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Welcome to Location Sharing App API",
        "version": "1.0.0",
        "status": "running",
        "docs": "/docs",
        "health": "/health"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "Location Sharing App",
        "environment": "development",
        "timestamp": time.time()
    }

@app.get("/api/v1/test")
async def test_endpoint():
    """Test endpoint for API v1"""
    return {
        "message": "API v1 is working",
        "endpoint": "/api/v1/test"
    }

@app.get("/test")
async def simple_test():
    """Simple test endpoint"""
    return {
        "message": "Simple test endpoint is working",
        "status": "ok"
    }

if __name__ == "__main__":
    print("🚀 Starting Location Sharing App (Super Simple Mode)...")
    print("📱 Backend will be available at: http://localhost:8000")
    print("📚 API docs will be at: http://localhost:8000/docs")
    print("🔍 Health check at: http://localhost:8000/health")
    print("🧪 Test endpoint at: http://localhost:8000/api/v1/test")
    
    uvicorn.run(
        "run_super_simple:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )