import math
from typing import Tuple

def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the great circle distance between two points 
    on the earth (specified in decimal degrees)
    
    Returns:
        Distance in kilometers
    """
    # Convert decimal degrees to radians
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    # Haversine formula
    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat/2)**2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon/2)**2
    c = 2 * math.asin(math.sqrt(a))
    
    # Radius of earth in kilometers
    r = 6371
    
    return c * r


def calculate_bearing(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """
    Calculate the bearing between two points
    
    Returns:
        Bearing in degrees (0-360)
    """
    lat1, lon1, lat2, lon2 = map(math.radians, [lat1, lon1, lat2, lon2])
    
    dlon = lon2 - lon1
    
    x = math.sin(dlon) * math.cos(lat2)
    y = math.cos(lat1) * math.sin(lat2) - math.sin(lat1) * math.cos(lat2) * math.cos(dlon)
    
    initial_bearing = math.atan2(x, y)
    
    # Convert to degrees and normalize to 0-360
    initial_bearing = math.degrees(initial_bearing)
    compass_bearing = (initial_bearing + 360) % 360
    
    return compass_bearing


def point_in_circle(point_lat: float, point_lon: float, 
                   center_lat: float, center_lon: float, 
                   radius_km: float) -> bool:
    """
    Check if a point is within a circular area
    
    Args:
        point_lat, point_lon: Point coordinates
        center_lat, center_lon: Circle center coordinates
        radius_km: Circle radius in kilometers
    
    Returns:
        True if point is within circle
    """
    distance = haversine_distance(point_lat, point_lon, center_lat, center_lon)
    return distance <= radius_km


def get_bounding_box(lat: float, lon: float, radius_km: float) -> Tuple[float, float, float, float]:
    """
    Get bounding box coordinates for a circle
    
    Returns:
        (min_lat, min_lon, max_lat, max_lon)
    """
    # Approximate degrees per km
    lat_degree = radius_km / 111.0
    lon_degree = radius_km / (111.0 * math.cos(math.radians(lat)))
    
    return (
        lat - lat_degree,
        lon - lon_degree,
        lat + lat_degree,
        lon + lon_degree
    )


def interpolate_points(lat1: float, lon1: float, 
                      lat2: float, lon2: float, 
                      num_points: int = 10) -> list:
    """
    Interpolate points between two coordinates
    
    Returns:
        List of (lat, lon) tuples
    """
    points = []
    for i in range(num_points + 1):
        fraction = i / num_points
        lat = lat1 + (lat2 - lat1) * fraction
        lon = lon1 + (lon2 - lon1) * fraction
        points.append((lat, lon))
    
    return points