import numpy as np
from datetime import datetime, timedelta
from typing import List, Dict

class NearMissDetectionService:
    """Member 2: Near-Miss Detection & Pattern Analysis"""
    
    def __init__(self):
        self.near_miss_threshold = 0.7  # Threshold for near-miss detection
        self.pattern_window = timedelta(hours=1)  # Time window for pattern analysis
        self.recent_events = []  # Store recent events for pattern detection
    
    def detect_near_miss(self, event_data: dict) -> dict:
        """
        Detect near-miss incidents based on vehicle behavior
        
        Args:
            event_data: {
                'latitude': float,
                'longitude': float,
                'speed': float,
                'acceleration': float,  # m/s²
                'steering_angle': float,  # degrees
                'time_gap': float,  # seconds to vehicle ahead
                'brake_force': float,  # 0-1
            }
        
        Returns:
            Near-miss detection result
        """
        near_miss_score = self._calculate_near_miss_score(event_data)
        pattern_type = self._identify_pattern(event_data)
        
        result = {
            "is_near_miss": near_miss_score > self.near_miss_threshold,
            "near_miss_score": round(near_miss_score, 2),
            "pattern_type": pattern_type,
            "severity": self._get_severity_level(near_miss_score),
            "timestamp": datetime.utcnow().isoformat(),
            "location": {
                "latitude": event_data.get('latitude'),
                "longitude": event_data.get('longitude')
            },
            "details": self._get_event_details(event_data, pattern_type)
        }
        
        # Store for pattern analysis
        if result["is_near_miss"]:
            self.recent_events.append(result)
            self._cleanup_old_events()
        
        return result
    
    def _calculate_near_miss_score(self, data: dict) -> float:
        """Calculate near-miss probability score"""
        score = 0.0
        
        # Sudden braking (high brake force)
        brake_force = data.get('brake_force', 0)
        if brake_force > 0.8:
            score += 0.4
        elif brake_force > 0.6:
            score += 0.2
        
        # Low time gap (tailgating)
        time_gap = data.get('time_gap', 10)
        if time_gap < 1.0:
            score += 0.3
        elif time_gap < 2.0:
            score += 0.15
        
        # High acceleration/deceleration
        acceleration = abs(data.get('acceleration', 0))
        if acceleration > 5.0:  # m/s²
            score += 0.2
        elif acceleration > 3.0:
            score += 0.1
        
        # Sharp steering (swerving)
        steering_angle = abs(data.get('steering_angle', 0))
        if steering_angle > 30:
            score += 0.25
        elif steering_angle > 15:
            score += 0.1
        
        # High speed increases risk
        speed = data.get('speed', 0)
        if speed > 100:
            score += 0.15
        elif speed > 80:
            score += 0.05
        
        return min(score, 1.0)
    
    def _identify_pattern(self, data: dict) -> str:
        """Identify the type of near-miss pattern"""
        brake_force = data.get('brake_force', 0)
        steering_angle = abs(data.get('steering_angle', 0))
        time_gap = data.get('time_gap', 10)
        acceleration = abs(data.get('acceleration', 0))
        
        if brake_force > 0.7 and acceleration > 4.0:
            return "sudden_brake"
        elif steering_angle > 20:
            return "swerve"
        elif time_gap < 1.5 and data.get('speed', 0) > 60:
            return "tailgating"
        elif acceleration > 5.0:
            return "aggressive_acceleration"
        else:
            return "close_call"
    
    def _get_severity_level(self, score: float) -> str:
        """Get severity level based on near-miss score"""
        if score >= 0.9:
            return "Critical"
        elif score >= 0.7:
            return "High"
        elif score >= 0.5:
            return "Moderate"
        else:
            return "Low"
    
    def _get_event_details(self, data: dict, pattern_type: str) -> dict:
        """Get detailed information about the event"""
        return {
            "speed_kmh": round(data.get('speed', 0), 1),
            "time_gap_seconds": round(data.get('time_gap', 0), 2),
            "brake_intensity": round(data.get('brake_force', 0) * 100, 1),
            "steering_angle": round(data.get('steering_angle', 0), 1),
            "pattern_description": self._get_pattern_description(pattern_type)
        }
    
    def _get_pattern_description(self, pattern_type: str) -> str:
        """Get human-readable description of pattern"""
        descriptions = {
            "sudden_brake": "Sudden hard braking detected",
            "swerve": "Sharp steering maneuver detected",
            "tailgating": "Unsafe following distance",
            "aggressive_acceleration": "Aggressive acceleration detected",
            "close_call": "Close call with potential hazard"
        }
        return descriptions.get(pattern_type, "Unknown pattern")
    
    def analyze_patterns(self, location: dict, radius_km: float = 1.0) -> dict:
        """
        Analyze near-miss patterns in a geographic area
        
        Args:
            location: {'latitude': float, 'longitude': float}
            radius_km: Search radius in kilometers
        
        Returns:
            Pattern analysis results
        """
        nearby_events = self._get_nearby_events(location, radius_km)
        
        if not nearby_events:
            return {
                "total_events": 0,
                "hotspot": False,
                "patterns": {}
            }
        
        # Count patterns
        pattern_counts = {}
        severity_counts = {"Critical": 0, "High": 0, "Moderate": 0, "Low": 0}
        
        for event in nearby_events:
            pattern = event.get("pattern_type", "unknown")
            pattern_counts[pattern] = pattern_counts.get(pattern, 0) + 1
            
            severity = event.get("severity", "Low")
            severity_counts[severity] += 1
        
        # Determine if it's a hotspot
        is_hotspot = len(nearby_events) >= 5 or severity_counts["Critical"] >= 2
        
        return {
            "total_events": len(nearby_events),
            "hotspot": is_hotspot,
            "risk_level": "High" if is_hotspot else "Moderate" if len(nearby_events) > 2 else "Low",
            "patterns": pattern_counts,
            "severity_distribution": severity_counts,
            "most_common_pattern": max(pattern_counts, key=pattern_counts.get) if pattern_counts else None,
            "recommendations": self._generate_area_recommendations(nearby_events, is_hotspot)
        }
    
    def _get_nearby_events(self, location: dict, radius_km: float) -> List[dict]:
        """Get events within radius of location"""
        nearby = []
        for event in self.recent_events:
            event_loc = event.get("location", {})
            distance = self._calculate_distance(
                location['latitude'], location['longitude'],
                event_loc.get('latitude'), event_loc.get('longitude')
            )
            if distance <= radius_km:
                nearby.append(event)
        return nearby
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance between two points in km (Haversine formula)"""
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(np.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = np.sin(dlat/2)**2 + np.cos(lat1) * np.cos(lat2) * np.sin(dlon/2)**2
        c = 2 * np.arcsin(np.sqrt(a))
        
        return R * c
    
    def _generate_area_recommendations(self, events: List[dict], is_hotspot: bool) -> List[str]:
        """Generate recommendations for an area"""
        recommendations = []
        
        if is_hotspot:
            recommendations.append("⚠️ High near-miss activity area - Exercise extreme caution")
            recommendations.append("Consider alternative route if possible")
        
        # Pattern-specific recommendations
        pattern_types = [e.get("pattern_type") for e in events]
        if pattern_types.count("sudden_brake") > 2:
            recommendations.append("Frequent sudden braking - Maintain extra following distance")
        if pattern_types.count("swerve") > 2:
            recommendations.append("Swerving incidents common - Watch for road hazards")
        if pattern_types.count("tailgating") > 2:
            recommendations.append("Tailgating common - Stay alert for aggressive drivers")
        
        if not recommendations:
            recommendations.append("✅ Normal traffic conditions - Standard precautions apply")
        
        return recommendations
    
    def _cleanup_old_events(self):
        """Remove events older than the pattern window"""
        cutoff = datetime.utcnow() - self.pattern_window
        self.recent_events = [
            e for e in self.recent_events 
            if datetime.fromisoformat(e['timestamp']) > cutoff
        ]

# Global instance
nearmiss_service = NearMissDetectionService()