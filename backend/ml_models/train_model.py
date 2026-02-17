import pandas as pd
import numpy as np
from sklearn.ensemble import RandomForestClassifier
from sklearn.preprocessing import LabelEncoder
from sklearn.model_selection import train_test_split
import joblib
import shap

def create_sample_dataset():
    """Create sample accident dataset for training"""
    np.random.seed(42)
    n_samples = 1000
    
    data = {
        'speed': np.random.uniform(20, 120, n_samples),
        'weather': np.random.choice(['Clear', 'Rain', 'Fog', 'Snow'], n_samples),
        'vehicle_type': np.random.choice(['Car', 'Truck', 'Motorcycle', 'Bus'], n_samples),
        'road_condition': np.random.choice(['Dry', 'Wet', 'Icy', 'Damaged'], n_samples),
        'visibility': np.random.choice(['Good', 'Moderate', 'Poor'], n_samples),
        'time_of_day': np.random.choice(['Morning', 'Afternoon', 'Evening', 'Night'], n_samples),
        'traffic_density': np.random.choice(['Low', 'Medium', 'High'], n_samples),
    }
    
    df = pd.DataFrame(data)
    
    # Generate severity based on features
    severity = []
    for _, row in df.iterrows():
        risk_score = 0
        if row['speed'] > 80: risk_score += 30
        if row['weather'] in ['Rain', 'Snow', 'Fog']: risk_score += 20
        if row['road_condition'] in ['Wet', 'Icy']: risk_score += 15
        if row['visibility'] == 'Poor': risk_score += 15
        if row['time_of_day'] == 'Night': risk_score += 10
        if row['traffic_density'] == 'High': risk_score += 10
        
        if risk_score < 30:
            severity.append('Minor')
        elif risk_score < 60:
            severity.append('Major')
        else:
            severity.append('Fatal')
    
    df['severity'] = severity
    df.to_csv('../data/accident_data.csv', index=False)
    return df

def train_model():
    """Train Random Forest model and SHAP explainer"""
    print("🔄 Creating sample dataset...")
    df = create_sample_dataset()
    
    # Prepare features
    label_encoders = {}
    categorical_cols = ['weather', 'vehicle_type', 'road_condition', 'visibility', 'time_of_day', 'traffic_density']
    
    X = df.drop('severity', axis=1).copy()
    y = df['severity']
    
    # Encode categorical features
    for col in categorical_cols:
        le = LabelEncoder()
        X[col] = le.fit_transform(X[col])
        label_encoders[col] = le
    
    # Encode target
    severity_encoder = LabelEncoder()
    y_encoded = severity_encoder.fit_transform(y)
    
    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y_encoded, test_size=0.2, random_state=42)
    
    # Train model
    print("🔄 Training Random Forest model...")
    model = RandomForestClassifier(n_estimators=100, random_state=42, max_depth=10)
    model.fit(X_train, y_train)
    
    # Calculate accuracy
    accuracy = model.score(X_test, y_test)
    print(f"✅ Model accuracy: {accuracy:.2%}")
    
    # Create SHAP explainer
    print("🔄 Creating SHAP explainer...")
    explainer = shap.TreeExplainer(model)
    
    # Save artifacts
    print("💾 Saving model and encoders...")
    joblib.dump(model, 'random_forest.pkl')
    joblib.dump(explainer, 'shap_explainer.pkl')
    joblib.dump(label_encoders, 'label_encoders.pkl')
    joblib.dump(severity_encoder, 'severity_encoder.pkl')
    
    print("✅ Training completed successfully!")
    print(f"   - Model: random_forest.pkl")
    print(f"   - SHAP Explainer: shap_explainer.pkl")
    print(f"   - Label Encoders: label_encoders.pkl")
    print(f"   - Severity Encoder: severity_encoder.pkl")

if __name__ == "__main__":
    train_model()