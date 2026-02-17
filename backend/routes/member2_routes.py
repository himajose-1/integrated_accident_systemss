from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.member2_nearmiss import nearmiss_service

router = APIRouter(prefix="/api/member2", tags=["Near-Miss Detection"])

class NearMissEvent(BaseModel):
    latitude: float
    longitude: float
    speed: float
    acceleration: float = 0
    steering_angle: float = 0
    time_gap: float = 10
    brake_force: float = 0

class PatternAnalysisRequest(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 1.0

@router.post("/detect")
async def detect_near_miss(event: NearMissEvent):
    """
    Detect near-miss incident from vehicle telemetry
    
    Analyzes sudden braking, swerving, tailgating, etc.
    """
    try:
        event_data = event.dict()
        result = nearmiss_service.detect_near_miss(event_data)
        
        return {
            "success": True,
            "data": result
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Detection failed: {str(e)}")

@router.post("/analyze-patterns")
async def analyze_patterns(request: PatternAnalysisRequest):
    """
    Analyze near-miss patterns in a geographic area
    
    Identifies hotspots and common incident patterns
    """
    try:
        location = {
            "latitude": request.latitude,
            "longitude": request.longitude
        }
        
        analysis = nearmiss_service.analyze_patterns(location, request.radius_km)
        
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/recent-events")
async def get_recent_events():
    """Get recent near-miss events"""
    try:
        events = nearmiss_service.recent_events
        
        return {
            "success": True,
            "data": {
                "total": len(events),
                "events": events
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch events: {str(e)}")