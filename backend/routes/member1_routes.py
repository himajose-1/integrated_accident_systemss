from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from services.member1_risk import risk_service

router = APIRouter(prefix="/api/member1", tags=["Risk Prediction"])

class RiskPredictionRequest(BaseModel):
    speed: float
    weather: str
    vehicle_type: str
    road_condition: str
    visibility: str
    time_of_day: str
    traffic_density: str
    latitude: Optional[float] = None
    longitude: Optional[float] = None

class LocationRiskRequest(BaseModel):
    latitude: float
    longitude: float
    speed: float = 60
    weather: str = "Clear"
    vehicle_type: str = "Car"
    road_condition: str = "Dry"
    visibility: str = "Good"
    time_of_day: str = "Afternoon"
    traffic_density: str = "Medium"

@router.post("/predict")
async def predict_risk(request: RiskPredictionRequest):
    """
    Predict accident severity and risk score
    
    Returns ML prediction with SHAP explainability
    """
    try:
        data = {
            "speed": request.speed,
            "weather": request.weather,
            "vehicle_type": request.vehicle_type,
            "road_condition": request.road_condition,
            "visibility": request.visibility,
            "time_of_day": request.time_of_day,
            "traffic_density": request.traffic_density
        }
        
        prediction = risk_service.predict(data)
        
        return {
            "success": True,
            "data": prediction
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Prediction failed: {str(e)}")

@router.post("/analyze-location")
async def analyze_location(request: LocationRiskRequest):
    """
    Analyze risk for a specific geographic location
    
    Combines location with current conditions for comprehensive analysis
    """
    try:
        conditions = {
            "speed": request.speed,
            "weather": request.weather,
            "vehicle_type": request.vehicle_type,
            "road_condition": request.road_condition,
            "visibility": request.visibility,
            "time_of_day": request.time_of_day,
            "traffic_density": request.traffic_density
        }
        
        analysis = risk_service.analyze_location_risk(
            request.latitude,
            request.longitude,
            conditions
        )
        
        return {
            "success": True,
            "data": analysis
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Analysis failed: {str(e)}")

@router.get("/feature-importance")
async def get_feature_importance():
    """Get global feature importance from the model"""
    try:
        importance = risk_service._get_feature_importance()
        
        return {
            "success": True,
            "data": {
                "importance": importance,
                "description": "Global feature importance scores from Random Forest model"
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get importance: {str(e)}")