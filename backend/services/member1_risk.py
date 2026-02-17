import joblib
import numpy as np
import pandas as pd
import shap
import os

class RiskPredictionService:
    """Member 1: Accident Risk Prediction & Severity Intelligence"""
    
    def __init__(self):
        model_dir = "ml_models"
        self.model = joblib.load(f"{model_dir}/random_forest.pkl")
        self.explainer = joblib.load(f"{model_dir}/shap_explainer.pkl")
        self.label_encoders = joblib.load(f"{model_dir}/label_encoders.pkl")
        self.severity_encoder = joblib.load(f"{model_dir}/severity_encoder.pkl")
        self.feature_names = ['speed', 'weather', 'vehicle_type', 'road_condition', 
                              'visibility', 'time_of_day', 'traffic_density']
    
    def preprocess_input(self, data: dict) -> pd.DataFrame:
        """Preprocess input data for prediction"""
        df = pd.DataFrame([data])
        
        # Encode categorical features
        for col in self.label_encoders.keys():
            if col in df.columns:
                try:
                    df[col] = self.label_encoders[col].transform(df[col])
                except:
                    # Handle unknown categories
                    df[col] = 0
        
        return df[self.feature_names]
    
    def predict(self, data: dict) -> dict:
        """
        Predict accident severity and calculate risk score
        
        Args:
            data: Dictionary with keys: speed, weather, vehicle_type, road_condition,
                  visibility, time_of_day, traffic_density
        
        Returns:
            Dictionary with severity, risk_score, confidence, shap_values
        """
        # Preprocess
        X = self.preprocess_input(data)
        
        # Predict
        prediction = self.model.predict(X)[0]
        probabilities = self.model.predict_proba(X)[0]
        
        # Get severity label
        severity = self.severity_encoder.inverse_transform([prediction])[0]
        
        # Calculate risk score (0-100)
        risk_score = self._calculate_risk_score(probabilities, severity)
        
        # Get SHAP values for explainability
        shap_values = self.explainer.shap_values(X)
        
        # Format SHAP values for response
        shap_dict = self._format_shap_values(shap_values, X, prediction)
        
        return {
            "severity": severity,
            "risk_score": round(risk_score, 2),
            "confidence": round(float(max(probabilities) * 100), 2),
            "probabilities": {
                "Minor": round(float(probabilities[0] * 100), 2),
                "Major": round(float(probabilities[1] * 100), 2),
                "Fatal": round(float(probabilities[2] * 100), 2)
            },
            "shap_values": shap_dict,
            "feature_importance": self._get_feature_importance()
        }
    
    def _calculate_risk_score(self, probabilities, severity):
        """Calculate risk score based on probabilities and severity"""
        # Weight by severity
        weights = {"Minor": 0.3, "Major": 0.6, "Fatal": 1.0}
        risk_score = (
            probabilities[0] * 30 +  # Minor
            probabilities[1] * 65 +  # Major
            probabilities[2] * 95    # Fatal
        )
        return risk_score
    
    def _format_shap_values(self, shap_values, X, prediction):
        """Format SHAP values for visualization"""
        # Get SHAP values for predicted class
        values = shap_values[prediction][0]
        
        # Create feature-value pairs
        shap_dict = {}
        for i, feature in enumerate(self.feature_names):
            shap_dict[feature] = {
                "value": float(X.iloc[0][i]),
                "shap_value": float(values[i]),
                "impact": "positive" if values[i] > 0 else "negative"
            }
        
        return shap_dict
    
    def _get_feature_importance(self):
        """Get feature importance from model"""
        importance = self.model.feature_importances_
        return {
            feature: round(float(imp * 100), 2) 
            for feature, imp in zip(self.feature_names, importance)
        }
    
    def analyze_location_risk(self, latitude: float, longitude: float, 
                             current_conditions: dict) -> dict:
        """Analyze risk for a specific location with current conditions"""
        prediction = self.predict(current_conditions)
        
        return {
            "location": {"latitude": latitude, "longitude": longitude},
            "prediction": prediction,
            "recommendations": self._generate_recommendations(prediction)
        }
    
    def _generate_recommendations(self, prediction: dict) -> list:
        """Generate safety recommendations based on prediction"""
        recommendations = []
        
        if prediction["risk_score"] > 70:
            recommendations.append("⚠️ High risk area - Consider alternative route")
            recommendations.append("Reduce speed significantly")
        elif prediction["risk_score"] > 40:
            recommendations.append("⚡ Moderate risk - Exercise caution")
            recommendations.append("Maintain safe following distance")
        else:
            recommendations.append("✅ Low risk area - Continue with normal precautions")
        
        # Feature-specific recommendations
        shap = prediction["shap_values"]
        if shap.get("speed", {}).get("shap_value", 0) > 0.1:
            recommendations.append("Speed is a major risk factor - slow down")
        if shap.get("weather", {}).get("shap_value", 0) > 0.1:
            recommendations.append("Weather conditions increase risk - drive carefully")
        
        return recommendations

# Global instance
risk_service = RiskPredictionService()