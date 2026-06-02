from caedoapi.ml.failure_model import FailurePredictorModel
from caedoapi.db import get_db

class PredictionService:
    def __init__(self):
        self.model = FailurePredictorModel()

    def predict_job_failure(self, job_id: int):
        """Calculates failure risk for a specific job."""
        with get_db() as conn:
            job = conn.execute("""
                SELECT j.*, p.reliability_score 
                FROM jobs j
                JOIN printers p ON j.recommended_printer_id = p.id
                WHERE j.id = ?
            """, (job_id,)).fetchone()
            
            if not job:
                return None
            
            # Extract features (with defaults if missing)
            risk = self.model.predict(
                minutes=job['minutes_estimated'] or 0,
                grams=job['grams_estimated'] or 0,
                material=job['material'],
                layer_height=0.2, # Default
                printer_reliability=job['reliability_score'] or 0.9
            )
            
            return {
                "job_id": job_id,
                "risk_score": round(risk * 100, 2),
                "risk_level": "High" if risk > 0.6 else "Medium" if risk > 0.3 else "Low",
                "factors": self._get_factors(job, risk)
            }

    def _get_factors(self, job, risk):
        factors = []
        if (job['minutes_estimated'] or 0) > 480:
            factors.append("Long print duration increases warp risk")
        if job['material'] == "ABS":
            factors.append("ABS material requires strict thermal control")
        if (job['reliability_score'] or 1.0) < 0.85:
            factors.append("Printer reliability is below optimal threshold")
        return factors

# Global instance
prediction_service = PredictionService()

