"""
Super Simple FastAPI App - Bypasses all complex imports
"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import time

# Create FastAPI app
app = FastAPI(
    title="Location Sharing App",
    description="Simple working version",
    version="1.0.0"
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
        "status": "working"
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "app": "Location Sharing App",
        "timestamp": time.time()
    }

@app.get("/api/v1/test")
async def test_endpoint():
    """Test endpoint"""
    return {
        "message": "API is working!",
        "endpoint": "/api/v1/test"
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)









