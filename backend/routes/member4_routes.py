from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List, Optional
from sqlalchemy.orm import Session
from services.member4_route import route_service
from models.database import get_db, AccidentReport

router = APIRouter(prefix="/api/member4", tags=["Route Safety Analysis"])

class Location(BaseModel):
    latitude: float
    longitude: float

class Waypoint(BaseModel):
    latitude: float
    longitude: float

class RouteAnalysisRequest(BaseModel):
    origin: Location
    destination: Location
    waypoints: Optional[List[Waypoint]] = []
    distance_km: Optional[float] = None
    duration_minutes: Optional[float] = None

@router.post("/analyze-route")
async def analyze_route(request: RouteAnalysisRequest, db: Session = Depends(get_db)):
    """
    Analyze safety of a route
    
    Identifies high-risk zones and provides safety recommendations
    """
    try:
        # Convert request to dict
        route_data = {
            "origin": request.origin.dict(),
            "destination": request.destination.dict(),
            "waypoints": [w.dict() for w in request.waypoints],
            "distance_km": request.distance_km or 0,
            "duration_minutes": request.duration_minutes or 0
        }
        
        # Get historical accident data from database
        accidents = db.query(AccidentReport).all()
        historical_data = [
            {
                "latitude": acc.latitude,
                "longitude": acc.longitude,
                "severity": acc.severity,
                "weather": acc.weather,
                "road_condition": acc.road_condition,
                "speed": acc.speed
            }
            for acc in accidents
        ]
        
        # Analyze route
        analysis = await route_service.analyze_route(route_data, historical_data)
        
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Route analysis failed: {str(e)}")

@router.post("/find-safe-route")
async def find_safe_route(request: RouteAnalysisRequest, db: Session = Depends(get_db)):
    """
    Find the safest route between two points
    
    Considers historical accident data and current conditions
    """
    try:
        # This would integrate with a routing service (Google Maps, OSRM, etc.)
        # For now, we analyze the direct route
        
        route_data = {
            "origin": request.origin.dict(),
            "destination": request.destination.dict(),
            "waypoints": [w.dict() for w in request.waypoints],
            "distance_km": request.distance_km or 0,
            "duration_minutes": request.duration_minutes or 0
        }
        
        accidents = db.query(AccidentReport).all()
        historical_data = [
            {
                "latitude": acc.latitude,
                "longitude": acc.longitude,
                "severity": acc.severity,
                "weather": acc.weather,
                "road_condition": acc.road_condition
            }
            for acc in accidents
        ]
        
        analysis = await route_service.analyze_route(route_data, historical_data)
        
        return {
            "success": True,
            "data": {
                "recommended_route": analysis,
                "message": "Route optimized for safety"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to find safe route: {str(e)}")

@router.get("/statistics")
async def get_statistics():
    """Get route analysis statistics"""
    try:
        from datetime import datetime, timedelta
        
        end_date = datetime.utcnow()
        start_date = end_date - timedelta(days=30)
        
        stats = route_service.get_route_statistics(start_date, end_date)
        
        return {
            "success": True,
            "data": stats
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch statistics: {str(e)}")