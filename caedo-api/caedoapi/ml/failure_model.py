import numpy as np
import pickle
import os
from sklearn.ensemble import RandomForestClassifier

MODEL_PATH = os.path.join(os.path.dirname(__file__), "failure_rf.pkl")

class FailurePredictorModel:
    def __init__(self):
        self.model = self._load_or_train()

    def _load_or_train(self):
        """Loads the model from disk or trains a new one with synthetic data."""
        if os.path.exists(MODEL_PATH):
            try:
                with open(MODEL_PATH, 'rb') as f:
                    return pickle.load(f)
            except Exception:
                pass
        
        # Fallback: Train a simple model with synthetic "common sense" data
        # Features: [minutes, grams, material_id, layer_height, printer_reliability]
        # Materials: PLA=0, PETG=1, TPU=2, ABS=3
        X = np.array([
            [60, 20, 0, 0.2, 0.95],   # Simple PLA job on good printer -> Success
            [600, 200, 3, 0.1, 0.8],  # Long ABS job on poor printer -> Failure
            [30, 5, 0, 0.3, 0.9],    # Short PLA job -> Success
            [1200, 500, 2, 0.2, 0.85], # Very long TPU job -> Failure
            [120, 40, 1, 0.15, 0.9],  # Medium PETG job -> Success
            [300, 100, 3, 0.2, 0.7],  # Medium ABS on bad printer -> Failure
        ])
        y = np.array([0, 1, 0, 1, 0, 1]) # 0=Success, 1=Failure

        model = RandomForestClassifier(n_estimators=10)
        model.fit(X, y)
        
        # Save for future use
        with open(MODEL_PATH, 'wb') as f:
            pickle.dump(model, f)
            
        return model

    def predict(self, minutes, grams, material, layer_height, printer_reliability):
        """Returns failure probability."""
        material_map = {"PLA": 0, "PETG": 1, "TPU": 2, "ABS": 3}
        mat_id = material_map.get(material, 0)
        
        features = np.array([[minutes, grams, mat_id, layer_height, printer_reliability]])
        prob = self.model.predict_proba(features)[0][1] # Probability of class 1 (Failure)
        return float(prob)

