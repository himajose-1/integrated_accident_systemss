import math
from typing import List, Dict, Tuple
import numpy as np
from datetime import datetime

class RouteAnalysisService:
    """Member 4: Route Safety Analysis"""
    
    def __init__(self):
        self.high_risk_threshold = 60  # Risk score threshold for high-risk zones
        self.zone_radius = 0.5  # km radius for risk zones
    
    async def analyze_route(self, route_data: dict, historical_data: List[dict] = None) -> dict:
        """
        Analyze safety of a route between origin and destination
        
        Args:
            route_data: {
                'origin': {'latitude': float, 'longitude': float},
                'destination': {'latitude': float, 'longitude': float},
                'waypoints': [{'latitude': float, 'longitude': float}, ...],
                'distance_km': float,
                'duration_minutes': float
            }
            historical_data: List of historical accidents/incidents
        
        Returns:
            Comprehensive route safety analysis
        """
        # Extract route points
        route_points = self._extract_route_points(route_data)
        
        # Analyze each segment
        segment_analyses = []
        total_risk_score = 0
        high_risk_zones = []
        
        for i in range(len(route_points) - 1):
            start = route_points[i]
            end = route_points[i + 1]
            
            segment_analysis = self._analyze_segment(start, end, historical_data or [])
            segment_analyses.append(segment_analysis)
            total_risk_score += segment_analysis['risk_score']
            
            if segment_analysis['is_high_risk']:
                high_risk_zones.append({
                    'location': start,
                    'risk_score': segment_analysis['risk_score'],
                    'reason': segment_analysis['risk_factors']
                })
        
        # Calculate overall safety score
        num_segments = len(segment_analyses)
        avg_risk_score = total_risk_score / num_segments if num_segments > 0 else 0
        safety_score = max(0, 100 - avg_risk_score)
        
        # Generate recommendations
        recommendations = self._generate_route_recommendations(
            safety_score, high_risk_zones, segment_analyses
        )
        
        # Find alternative safer segments if high risk
        alternatives = []
        if safety_score < 70:
            alternatives = self._suggest_alternatives(route_points, high_risk_zones)
        
        # Create hotspots from high-risk zones with accident data
        hotspots = self._create_hotspots(route_points, historical_data or [])
        
        # Determine safety level
        if avg_risk_score < 20:
            safety_level = "Low Risk"
        elif avg_risk_score < 40:
            safety_level = "Moderate Risk"
        elif avg_risk_score < 60:
            safety_level = "High Risk"
        else:
            safety_level = "Very High Risk"
        
        return {
            "route_summary": {
                "distance_km": route_data.get('distance_km', 0),
                "duration_minutes": route_data.get('duration_minutes', 0)
            },
            "safety_analysis": {
                "overall_risk_score": round(avg_risk_score / 10, 2),  # Scale to 0-10
                "safety_level": safety_level,
                "high_risk_zones": len(high_risk_zones)
            },
            "hotspots": hotspots,
            "recommendations": recommendations,
            "alternative_routes": alternatives,
            "segment_analysis": segment_analyses,
            "statistics": {
                "total_segments": num_segments,
                "high_risk_segments": sum(1 for s in segment_analyses if s['is_high_risk']),
                "average_segment_risk": round(avg_risk_score, 2)
            }
        }
    
    def _create_hotspots(self, route_points: List[dict], historical_data: List[dict]) -> List[dict]:
        """Create hotspot data from accidents near route"""
        hotspots = []
        
        # Find all accidents within radius of any route point
        for point in route_points:
            nearby_accidents = []
            
            for accident in historical_data:
                distance = self._calculate_distance(
                    point['latitude'], point['longitude'],
                    accident.get('latitude', 0), accident.get('longitude', 0)
                )
                
                if distance <= self.zone_radius * 2:  # Wider radius for hotspot detection
                    nearby_accidents.append(accident)
            
            if len(nearby_accidents) >= 2:  # Only create hotspot if 2+ accidents
                # Count by severity
                fatal_count = sum(1 for a in nearby_accidents if a.get('severity') == 'Fatal')
                serious_count = sum(1 for a in nearby_accidents if a.get('severity') == 'Major')
                minor_count = sum(1 for a in nearby_accidents if a.get('severity') == 'Minor')
                
                # Determine risk level
                if fatal_count > 0:
                    risk_level = "High"
                elif serious_count > 2:
                    risk_level = "High"
                elif len(nearby_accidents) > 5:
                    risk_level = "Medium"
                else:
                    risk_level = "Low"
                
                # Get common weather and road conditions
                weather_list = [a.get('weather', 'Unknown') for a in nearby_accidents]
                road_list = [a.get('road_condition', 'Unknown') for a in nearby_accidents]
                
                common_weather = max(set(weather_list), key=weather_list.count) if weather_list else 'N/A'
                common_road = max(set(road_list), key=road_list.count) if road_list else 'N/A'
                
                hotspots.append({
                    "latitude": point['latitude'],
                    "longitude": point['longitude'],
                    "accident_count": len(nearby_accidents),
                    "fatal_count": fatal_count,
                    "serious_count": serious_count,
                    "minor_count": minor_count,
                    "risk_level": risk_level,
                    "common_weather": common_weather,
                    "common_road_condition": common_road
                })
        
        # Remove duplicate hotspots (same location)
        unique_hotspots = []
        for hotspot in hotspots:
            is_duplicate = False
            for existing in unique_hotspots:
                if abs(hotspot['latitude'] - existing['latitude']) < 0.01 and \
                   abs(hotspot['longitude'] - existing['longitude']) < 0.01:
                    is_duplicate = True
                    break
            if not is_duplicate:
                unique_hotspots.append(hotspot)
        
        return unique_hotspots
    
    def _extract_route_points(self, route_data: dict) -> List[dict]:
        """Extract ordered list of points along route"""
        points = []
        
        # Add origin
        points.append(route_data['origin'])
        
        # Add waypoints
        if 'waypoints' in route_data and route_data['waypoints']:
            points.extend(route_data['waypoints'])
        
        # Add destination
        points.append(route_data['destination'])
        
        return points
    
    def _analyze_segment(self, start: dict, end: dict, historical_data: List[dict]) -> dict:
        """Analyze safety of a route segment"""
        # Calculate segment length
        segment_length = self._calculate_distance(
            start['latitude'], start['longitude'],
            end['latitude'], end['longitude']
        )
        
        # Find nearby incidents
        nearby_incidents = self._find_nearby_incidents(start, end, historical_data)
        
        # Calculate risk score based on incident density
        incident_density = len(nearby_incidents) / max(segment_length, 0.1)
        base_risk_score = min(incident_density * 20, 80)
        
        # Adjust for severity of incidents
        severity_weights = {"Minor": 1, "Major": 2, "Fatal": 3}
        severity_adjustment = sum(
            severity_weights.get(inc.get('severity', 'Minor'), 1) 
            for inc in nearby_incidents
        ) * 5
        
        risk_score = min(base_risk_score + severity_adjustment, 100)
        
        # Identify risk factors
        risk_factors = []
        if len(nearby_incidents) > 3:
            risk_factors.append(f"High accident frequency ({len(nearby_incidents)} incidents)")
        if any(inc.get('severity') == 'Fatal' for inc in nearby_incidents):
            risk_factors.append("Fatal accidents reported in area")
        if incident_density > 5:
            risk_factors.append("Very high incident density")
        
        # Check for patterns
        if nearby_incidents:
            common_conditions = self._identify_common_conditions(nearby_incidents)
            if common_conditions:
                risk_factors.append(f"Common conditions: {', '.join(common_conditions)}")
        
        return {
            "start": start,
            "end": end,
            "distance_km": round(segment_length, 2),
            "risk_score": round(risk_score, 2),
            "is_high_risk": risk_score >= self.high_risk_threshold,
            "incident_count": len(nearby_incidents),
            "risk_factors": risk_factors,
            "incidents": nearby_incidents[:5]  # Top 5 nearest incidents
        }
    
    def _find_nearby_incidents(self, start: dict, end: dict, incidents: List[dict]) -> List[dict]:
        """Find incidents near a route segment"""
        nearby = []
        
        for incident in incidents:
            # Calculate distance from incident to segment
            distance = self._point_to_segment_distance(
                incident.get('latitude', 0), incident.get('longitude', 0),
                start['latitude'], start['longitude'],
                end['latitude'], end['longitude']
            )
            
            if distance <= self.zone_radius:
                incident_copy = incident.copy()
                incident_copy['distance_to_route_km'] = round(distance, 3)
                nearby.append(incident_copy)
        
        # Sort by distance to route
        nearby.sort(key=lambda x: x['distance_to_route_km'])
        
        return nearby
    
    def _point_to_segment_distance(self, px: float, py: float, 
                                   x1: float, y1: float, 
                                   x2: float, y2: float) -> float:
        """Calculate minimum distance from point to line segment"""
        # Convert to approximate cartesian coordinates
        px_cart, py_cart = px, py
        x1_cart, y1_cart = x1, y1
        x2_cart, y2_cart = x2, y2
        
        # Vector from start to end
        dx = x2_cart - x1_cart
        dy = y2_cart - y1_cart
        
        if dx == 0 and dy == 0:
            # Segment is a point
            return self._calculate_distance(px, py, x1, y1)
        
        # Parameter t for projection
        t = max(0, min(1, ((px_cart - x1_cart) * dx + (py_cart - y1_cart) * dy) / (dx * dx + dy * dy)))
        
        # Closest point on segment
        closest_x = x1_cart + t * dx
        closest_y = y1_cart + t * dy
        
        # Distance to closest point
        return self._calculate_distance(px, py, closest_x, closest_y)
    
    def _calculate_distance(self, lat1: float, lon1: float, lat2: float, lon2: float) -> float:
        """Calculate distance in km using Haversine formula"""
        R = 6371  # Earth's radius in km
        
        lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
        dlat = lat2 - lat1
        dlon = lon2 - lon1
        
        a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
        c = 2 * math.asin(math.sqrt(a))
        
        return R * c
    
    def _identify_common_conditions(self, incidents: List[dict]) -> List[str]:
        """Identify common conditions in incidents"""
        if not incidents:
            return []
        
        conditions = []
        
        # Check weather
        weather_counts = {}
        for inc in incidents:
            weather = inc.get('weather', 'Unknown')
            weather_counts[weather] = weather_counts.get(weather, 0) + 1
        
        if weather_counts:
            most_common_weather = max(weather_counts, key=weather_counts.get)
            if weather_counts[most_common_weather] > len(incidents) * 0.5:
                conditions.append(f"{most_common_weather} weather")
        
        # Check road conditions
        road_counts = {}
        for inc in incidents:
            road = inc.get('road_condition', 'Unknown')
            road_counts[road] = road_counts.get(road, 0) + 1
        
        if road_counts:
            most_common_road = max(road_counts, key=road_counts.get)
            if road_counts[most_common_road] > len(incidents) * 0.5:
                conditions.append(f"{most_common_road} roads")
        
        return conditions[:3]  # Top 3 conditions
    
    def _get_risk_level(self, safety_score: float) -> str:
        """Get risk level from safety score"""
        if safety_score >= 80:
            return "Low"
        elif safety_score >= 60:
            return "Moderate"
        elif safety_score >= 40:
            return "High"
        else:
            return "Very High"
    
    def _generate_route_recommendations(self, safety_score: float, 
                                       high_risk_zones: List[dict],
                                       segments: List[dict]) -> List[str]:
        """Generate safety recommendations for route"""
        recommendations = []
        
        if safety_score >= 80:
            recommendations.append("✅ Route appears safe - enjoy your journey!")
            recommendations.append("Maintain safe driving practices throughout")
        elif safety_score >= 60:
            recommendations.append("⚠️ Exercise normal caution on this route")
            recommendations.append("Stay alert and follow traffic rules")
        else:
            recommendations.append("🚨 High risk route - consider alternatives if possible")
            recommendations.append("If you must take this route, exercise extreme caution")
        
        if high_risk_zones:
            recommendations.append(f"🔴 {len(high_risk_zones)} high-risk zones identified along the route")
            recommendations.append("Reduce speed and increase following distance in marked zones")
        
        # Segment-specific recommendations
        high_risk_segments = [s for s in segments if s['is_high_risk']]
        if high_risk_segments:
            recommendations.append(f"Be especially careful in {len(high_risk_segments)} segment(s) with elevated risk")
        
        # Time-based recommendations
        current_hour = datetime.utcnow().hour
        if 22 <= current_hour or current_hour <= 5:
            recommendations.append("🌙 Night driving - ensure good visibility and adequate rest")
        
        # General safety tips
        recommendations.append("Check weather conditions before departure")
        recommendations.append("Ensure vehicle is in good condition")
        
        return recommendations
    
    def _suggest_alternatives(self, route_points: List[dict], 
                             high_risk_zones: List[dict]) -> List[dict]:
        """Suggest alternative route options"""
        alternatives = []
        
        if len(high_risk_zones) > 0:
            alternatives.append({
                "type": "avoid_zones",
                "description": "Consider routes that avoid identified high-risk zones",
                "potential_improvement": "May reduce risk by 30-50%"
            })
        
        alternatives.append({
            "type": "time_change",
            "description": "Consider traveling during daylight hours (6 AM - 6 PM) if possible",
            "potential_improvement": "Daylight travel reduces risk by ~25%"
        })
        
        if len(high_risk_zones) > 2:
            alternatives.append({
                "type": "public_transport",
                "description": "Consider using public transportation for this route",
                "potential_improvement": "Professional drivers and safer vehicles"
            })
        
        return alternatives
    
    def get_route_statistics(self, start_date: datetime, end_date: datetime) -> dict:
        """Get route analysis statistics for a time period"""
        # This would query the database for actual statistics
        return {
            "total_routes_analyzed": 0,
            "average_safety_score": 0,
            "high_risk_routes": 0,
            "most_common_risk_factors": []
        }

# Global instance
route_service = RouteAnalysisService()