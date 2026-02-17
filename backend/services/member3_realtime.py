from typing import Dict, List, Set
from datetime import datetime, timedelta
from fastapi import WebSocket
import json
import asyncio

class WebSocketManager:
    """Manager for WebSocket connections"""
    
    def __init__(self):
        self.active_connections: Set[WebSocket] = set()
        self.user_locations: Dict[WebSocket, dict] = {}
    
    async def connect(self, websocket: WebSocket):
        """Accept new WebSocket connection"""
        await websocket.accept()
        self.active_connections.add(websocket)
        print(f"✅ WebSocket connected. Total connections: {len(self.active_connections)}")
    
    def disconnect(self, websocket: WebSocket):
        """Remove WebSocket connection"""
        self.active_connections.discard(websocket)
        self.user_locations.pop(websocket, None)
        print(f"❌ WebSocket disconnected. Total connections: {len(self.active_connections)}")
    
    async def send_personal_message(self, message: dict, websocket: WebSocket):
        """Send message to specific client"""
        try:
            await websocket.send_json(message)
        except Exception as e:
            print(f"Error sending message: {e}")
            self.disconnect(websocket)
    
    async def broadcast(self, message: dict):
        """Broadcast message to all connected clients"""
        disconnected = set()
        for connection in self.active_connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                print(f"Error broadcasting to client: {e}")
                disconnected.add(connection)
        
        # Clean up disconnected clients
        for conn in disconnected:
            self.disconnect(conn)
    
    async def broadcast_to_area(self, message: dict, center_lat: float, center_lng: float, radius_km: float = 10):
        """Broadcast message to clients in specific geographic area"""
        for connection, location in self.user_locations.items():
            if self._is_within_radius(location, center_lat, center_lng, radius_km):
                await self.send_personal_message(message, connection)
    
    def update_user_location(self, websocket: WebSocket, latitude: float, longitude: float):
        """Update user's location"""
        self.user_locations[websocket] = {
            "latitude": latitude,
            "longitude": longitude,
            "updated_at": datetime.utcnow()
        }
    
    def _is_within_radius(self, location: dict, lat: float, lng: float, radius_km: float) -> bool:
        """Check if location is within radius"""
        import math
        
        R = 6371  # Earth's radius in km
        lat1, lon1 = math.radians(location['latitude']), math.radians(location['longitude'])
        lat2, lon2 = math.radians(lat), math.radians(lng)
        
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c <= radius_km


class RealTimeAlertService:
    """Member 3: Real-Time Alert System"""
    
    def __init__(self):
        self.websocket_manager = WebSocketManager()
        self.active_alerts: List[dict] = []
        self.alert_id_counter = 0
    
    async def create_alert(self, alert_data: dict) -> dict:
        """
        Create and broadcast real-time alert
        
        Args:
            alert_data: {
                'type': 'accident' | 'near_miss' | 'high_risk' | 'weather' | 'traffic',
                'severity': 'low' | 'medium' | 'high' | 'critical',
                'latitude': float,
                'longitude': float,
                'message': str,
                'radius_km': float (optional, default 10),
                'duration_minutes': int (optional, default 60)
            }
        
        Returns:
            Created alert object
        """
        self.alert_id_counter += 1
        
        duration = timedelta(minutes=alert_data.get('duration_minutes', 60))
        
        alert = {
            "id": self.alert_id_counter,
            "type": alert_data['type'],
            "severity": alert_data['severity'],
            "location": {
                "latitude": alert_data['latitude'],
                "longitude": alert_data['longitude']
            },
            "message": alert_data['message'],
            "created_at": datetime.utcnow().isoformat(),
            "expires_at": (datetime.utcnow() + duration).isoformat(),
            "radius_km": alert_data.get('radius_km', 10),
            "active": True,
            "icon": self._get_alert_icon(alert_data['type']),
            "color": self._get_alert_color(alert_data['severity'])
        }
        
        # Store alert
        self.active_alerts.append(alert)
        
        # Broadcast to affected area
        await self._broadcast_alert(alert)
        
        return alert
    
    async def _broadcast_alert(self, alert: dict):
        """Broadcast alert to clients in affected area"""
        broadcast_message = {
            "event": "new_alert",
            "data": alert
        }
        
        # Broadcast to area
        await self.websocket_manager.broadcast_to_area(
            broadcast_message,
            alert['location']['latitude'],
            alert['location']['longitude'],
            alert['radius_km']
        )
        
        # Also broadcast to all for map updates
        await self.websocket_manager.broadcast({
            "event": "alert_created",
            "alert_id": alert['id'],
            "type": alert['type'],
            "location": alert['location']
        })
    
    def _get_alert_icon(self, alert_type: str) -> str:
        """Get icon for alert type"""
        icons = {
            "accident": "🚨",
            "near_miss": "⚠️",
            "high_risk": "🔴",
            "weather": "🌧️",
            "traffic": "🚦",
            "roadwork": "🚧"
        }
        return icons.get(alert_type, "⚠️")
    
    def _get_alert_color(self, severity: str) -> str:
        """Get color for severity level"""
        colors = {
            "low": "#FFA500",      # Orange
            "medium": "#FF6B00",   # Dark orange
            "high": "#FF0000",     # Red
            "critical": "#8B0000"  # Dark red
        }
        return colors.get(severity, "#FFA500")
    
    def get_active_alerts(self, latitude: float = None, longitude: float = None, 
                         radius_km: float = None) -> List[dict]:
        """Get active alerts, optionally filtered by location"""
        # Cleanup expired alerts
        self._cleanup_expired_alerts()
        
        if latitude is None or longitude is None:
            return [a for a in self.active_alerts if a['active']]
        
        # Filter by location
        nearby_alerts = []
        for alert in self.active_alerts:
            if not alert['active']:
                continue
            
            distance = self._calculate_distance(
                latitude, longitude,
                alert['location']['latitude'],
                alert['location']['longitude']
            )
            
            if distance <= (radius_km or alert['radius_km']):
                alert_copy = alert.copy()
                alert_copy['distance_km'] = round(distance, 2)
                nearby_alerts.append(alert_copy)
        
        # Sort by severity and distance
        severity_order = {"critical": 0, "high": 1, "medium": 2, "low": 3}
        nearby_alerts.sort(key=lambda x: (severity_order.get(x['severity'], 4), x.get('distance_km', 999)))
        
        return nearby_alerts
    
    async def dismiss_alert(self, alert_id: int):
        """Dismiss an alert"""
        for alert in self.active_alerts:
            if alert['id'] == alert_id:
                alert['active'] = False
                
                # Broadcast dismissal
                await self.websocket_manager.broadcast({
                    "event": "alert_dismissed",
                    "alert_id": alert_id
                })
                
                return True
        return False
    
    def _cleanup_expired_alerts(self):
        """Remove expired alerts"""
        now = datetime.utcnow()
        for alert in self.active_alerts:
            expires_at = datetime.fromisoformat(alert['expires_at'])
            if now > expires_at:
                alert['active'] = False
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in km"""
        import math
        
        R = 6371
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    async def broadcast_accident_report(self, report: dict):
        """Broadcast new accident report to all clients"""
        await self.websocket_manager.broadcast({
            "event": "new_accident",
            "data": report
        })
    
    async def broadcast_system_update(self, update_type: str, data: dict):
        """Broadcast system updates"""
        await self.websocket_manager.broadcast({
            "event": "system_update",
            "type": update_type,
            "data": data
        })

# Global instance
realtime_service = RealTimeAlertService()
websocket_manager = realtime_service.websocket_manager