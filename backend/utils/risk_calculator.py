from typing import Dict, List
import math

class RiskScoreCalculator:
    """Utility class for calculating various risk scores"""
    
    @staticmethod
    def calculate_weather_risk(weather: str) -> float:
        """Calculate risk score based on weather conditions (0-1)"""
        weather_risk_map = {
            'Clear': 0.1,
            'Cloudy': 0.2,
            'Rain': 0.6,
            'Heavy Rain': 0.8,
            'Fog': 0.7,
            'Snow': 0.9,
            'Ice': 0.95
        }
        return weather_risk_map.get(weather, 0.5)
    
    @staticmethod
    def calculate_speed_risk(speed: float, speed_limit: float = 60) -> float:
        """Calculate risk score based on speed (0-1)"""
        if speed <= speed_limit * 0.8:
            return 0.1
        elif speed <= speed_limit:
            return 0.3
        elif speed <= speed_limit * 1.2:
            return 0.6
        else:
            return min(0.95, 0.6 + (speed - speed_limit * 1.2) / 100)
    
    @staticmethod
    def calculate_time_risk(hour: int) -> float:
        """Calculate risk score based on time of day (0-1)"""
        # Higher risk during night hours
        if 22 <= hour or hour <= 5:
            return 0.7
        elif 6 <= hour <= 8 or 17 <= hour <= 19:
            return 0.5  # Rush hour
        else:
            return 0.2
    
    @staticmethod
    def calculate_traffic_risk(density: str) -> float:
        """Calculate risk score based on traffic density (0-1)"""
        density_map = {
            'Low': 0.2,
            'Medium': 0.4,
            'High': 0.7,
            'Very High': 0.9
        }
        return density_map.get(density, 0.4)
    
    @staticmethod
    def calculate_road_condition_risk(condition: str) -> float:
        """Calculate risk score based on road condition (0-1)"""
        condition_map = {
            'Excellent': 0.1,
            'Good': 0.2,
            'Dry': 0.2,
            'Fair': 0.4,
            'Wet': 0.6,
            'Poor': 0.7,
            'Damaged': 0.8,
            'Icy': 0.95
        }
        return condition_map.get(condition, 0.5)
    
    @staticmethod
    def calculate_composite_risk(factors: Dict[str, any]) -> float:
        """
        Calculate composite risk score from multiple factors
        
        Args:
            factors: Dictionary containing risk factors
                - weather: str
                - speed: float
                - speed_limit: float
                - hour: int
                - traffic_density: str
                - road_condition: str
        
        Returns:
            Risk score (0-100)
        """
        weights = {
            'weather': 0.25,
            'speed': 0.30,
            'time': 0.15,
            'traffic': 0.15,
            'road': 0.15
        }
        
        calculator = RiskScoreCalculator()
        
        scores = {}
        
        if 'weather' in factors:
            scores['weather'] = calculator.calculate_weather_risk(factors['weather'])
        
        if 'speed' in factors:
            speed_limit = factors.get('speed_limit', 60)
            scores['speed'] = calculator.calculate_speed_risk(factors['speed'], speed_limit)
        
        if 'hour' in factors:
            scores['time'] = calculator.calculate_time_risk(factors['hour'])
        
        if 'traffic_density' in factors:
            scores['traffic'] = calculator.calculate_traffic_risk(factors['traffic_density'])
        
        if 'road_condition' in factors:
            scores['road'] = calculator.calculate_road_condition_risk(factors['road_condition'])
        
        # Calculate weighted average
        total_weight = sum(weights[k] for k in scores.keys())
        composite_score = sum(scores[k] * weights[k] for k in scores.keys()) / total_weight
        
        # Convert to 0-100 scale
        return composite_score * 100
    
    @staticmethod
    def categorize_risk(risk_score: float) -> str:
        """Categorize risk score into levels"""
        if risk_score < 25:
            return "Low"
        elif risk_score < 50:
            return "Moderate"
        elif risk_score < 75:
            return "High"
        else:
            return "Critical"
    
    @staticmethod
    def calculate_severity_probability(risk_score: float) -> Dict[str, float]:
        """
        Calculate probability of each severity level
        
        Returns:
            Dictionary with probabilities for Minor, Major, Fatal
        """
        # Sigmoid-like functions for each severity
        minor_prob = 1 / (1 + math.exp((risk_score - 30) / 10))
        fatal_prob = 1 / (1 + math.exp((70 - risk_score) / 10))
        major_prob = 1 - minor_prob - fatal_prob
        
        # Normalize to ensure sum = 1
        total = minor_prob + major_prob + fatal_prob
        
        return {
            'Minor': minor_prob / total,
            'Major': major_prob / total,
            'Fatal': fatal_prob / total
        }