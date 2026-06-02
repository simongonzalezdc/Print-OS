from typing import List, Dict, Any
from caedoapi.db import get_db

class MaterialForecaster:
    @staticmethod
    def get_forecast(days: int = 7) -> Dict[str, Any]:
        """
        Calculates material requirements for the next N days.
        Currently based on queued jobs.
        """
        with get_db() as conn:
            # 1. Aggregated needs from queued jobs
            rows = conn.execute("""
                SELECT material, SUM(grams_estimated) as total_grams
                FROM jobs
                WHERE status = 'queued'
                GROUP BY material
            """).fetchall()
            
            queued_needs = {row['material']: row['total_grams'] for row in rows}
            
            # 2. Historical average usage per day
            # (In a real app, you'd query the 'completed' jobs from the last 30 days)
            hist_rows = conn.execute("""
                SELECT material, AVG(grams_actual) as avg_daily_grams
                FROM jobs
                WHERE status = 'completed' 
                AND finished_at >= datetime('now', '-30 days')
                GROUP BY material
            """).fetchall()
            
            daily_averages = {row['material']: row['avg_daily_grams'] or 50.0 for row in hist_rows}
            
            # 3. Combine and project
            materials = set(queued_needs.keys()) | set(daily_averages.keys())
            if not materials:
                materials = {"PLA", "PETG", "TPU"}
                
            forecast = []
            for mat in materials:
                needed_now = queued_needs.get(mat, 0)
                projected_usage = daily_averages.get(mat, 50.0) * days
                total_needed = needed_now + projected_usage
                
                # Add a 20% safety buffer
                total_with_buffer = total_needed * 1.2
                
                forecast.append({
                    "material": mat,
                    "queued_grams": round(needed_now, 2),
                    "projected_grams": round(projected_usage, 2),
                    "total_required_kg": round(total_with_buffer / 1000, 2),
                    "status": "Warning" if total_with_buffer > 5000 else "Optimal"
                })
                
            return {
                "days": days,
                "forecast": forecast
            }

# Global instance
material_forecaster = MaterialForecaster()

