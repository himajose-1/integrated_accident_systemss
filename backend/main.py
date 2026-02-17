from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from models.database import init_db
from routes import member1_routes, member2_routes, member3_routes, member4_routes, reporting_routes
import uvicorn
import logging

# Configure logging to reduce verbosity
logging.getLogger("uvicorn").setLevel(logging.WARNING)
logging.getLogger("uvicorn.access").setLevel(logging.WARNING)
logging.getLogger("fastapi").setLevel(logging.WARNING)

# Initialize FastAPI app
app = FastAPI(
    title="Integrated Accident Analysis System",
    description="Complete road accident analysis with ML prediction, near-miss detection, real-time alerts, and route safety",
    version="1.0.0"
)

# CORS middleware for frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify exact origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include all member routes
app.include_router(member1_routes.router)
app.include_router(member2_routes.router)
app.include_router(member3_routes.router)
app.include_router(member4_routes.router)
app.include_router(reporting_routes.router)

@app.on_event("startup")
async def startup_event():
    """Initialize database on startup"""
    print("🚀 Starting Integrated Accident Analysis System...")
    init_db()
    print("✅ System ready!")

@app.get("/")
async def root():
    """Root endpoint"""
    return {
        "message": "Integrated Accident Analysis System API",
        "version": "1.0.0",
        "members": {
            "member1": "Risk Prediction & Severity Intelligence",
            "member2": "Near-Miss Detection & Pattern Analysis",
            "member3": "Real-Time Alert System",
            "member4": "Route Safety Analysis"
        },
        "endpoints": {
            "member1": "/api/member1",
            "member2": "/api/member2",
            "member3": "/api/member3",
            "member4": "/api/member4",
            "reports": "/api/reports",
            "websocket": "/api/member3/ws",
            "docs": "/docs"
        }
    }

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "integrated-accident-system"
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="warning",
        access_log=False  # Disable access logs to reduce noise
    )