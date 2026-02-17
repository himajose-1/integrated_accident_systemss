from fastapi import APIRouter, HTTPException, WebSocket, WebSocketDisconnect
from pydantic import BaseModel
from typing import Optional, List
from services.member3_realtime import realtime_service, websocket_manager

router = APIRouter(prefix="/api/member3", tags=["Real-Time Alerts"])

class AlertCreate(BaseModel):
    type: str  # accident, near_miss, high_risk, weather, traffic
    severity: str  # low, medium, high, critical
    latitude: float
    longitude: float
    message: str
    radius_km: float = 10
    duration_minutes: int = 60

class LocationQuery(BaseModel):
    latitude: float
    longitude: float
    radius_km: float = 10

@router.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    """
    WebSocket endpoint for real-time updates
    
    Clients connect here to receive live alerts and updates
    """
    await websocket_manager.connect(websocket)
    try:
        while True:
            data = await websocket.receive_json()
            
            # Handle different message types
            if data.get("type") == "location_update":
                websocket_manager.update_user_location(
                    websocket,
                    data.get("latitude"),
                    data.get("longitude")
                )
                await websocket_manager.send_personal_message({
                    "event": "location_updated",
                    "status": "success"
                }, websocket)
            
            elif data.get("type") == "ping":
                await websocket_manager.send_personal_message({
                    "event": "pong",
                    "timestamp": data.get("timestamp")
                }, websocket)
    
    except WebSocketDisconnect:
        websocket_manager.disconnect(websocket)
    except Exception as e:
        print(f"WebSocket error: {e}")
        websocket_manager.disconnect(websocket)

@router.post("/alerts")
async def create_alert(alert: AlertCreate):
    """
    Create a new real-time alert
    
    Alert will be broadcast to users in the affected area
    """
    try:
        alert_data = alert.dict()
        created_alert = await realtime_service.create_alert(alert_data)
        
        return {
            "success": True,
            "data": created_alert
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to create alert: {str(e)}")

@router.post("/alerts/nearby")
async def get_nearby_alerts(location: LocationQuery):
    """
    Get active alerts near a location
    """
    try:
        alerts = realtime_service.get_active_alerts(
            location.latitude,
            location.longitude,
            location.radius_km
        )
        
        return {
            "success": True,
            "data": {
                "count": len(alerts),
                "alerts": alerts
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")

@router.get("/alerts")
async def get_all_alerts():
    """Get all active alerts"""
    try:
        alerts = realtime_service.get_active_alerts()
        
        return {
            "success": True,
            "data": {
                "count": len(alerts),
                "alerts": alerts
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to fetch alerts: {str(e)}")

@router.delete("/alerts/{alert_id}")
async def dismiss_alert(alert_id: int):
    """Dismiss an alert"""
    try:
        success = await realtime_service.dismiss_alert(alert_id)
        
        if not success:
            raise HTTPException(status_code=404, detail="Alert not found")
        
        return {
            "success": True,
            "message": "Alert dismissed"
        }
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to dismiss alert: {str(e)}")