from typing import List, Dict, Any, Optional
import json

class RoutingEngine:
    # Configurable scoring weights
    DEFAULT_WEIGHTS = {
        "reliability": 30,      # Max 30 points
        "urgency_match": 20,    # Max 20 points
        "right_sizing": 20,     # Max 20 points
        "queue_depth": 20,      # Max 20 points
        "quality_match": 10     # Max 10 points
    }

    @staticmethod
    def get_recommendation(job_spec: Dict[str, Any], printers: List[Dict[str, Any]], weights: Dict[str, int] = None) -> Dict[str, Any]:
        """
        Recommends the best printer for a job based on constraints and scoring.
        """
        results = []
        eligible_ids = []
        w = weights or RoutingEngine.DEFAULT_WEIGHTS
        
        for p in printers:
            # ... (rest of the logic remains the same, but using 'w' for scores) ...
            # 1. Constraints
            try:
                supported_materials = json.loads(p['supports_materials_json'])
                if not isinstance(supported_materials, list):
                    supported_materials = []
            except (json.JSONDecodeError, TypeError, KeyError):
                supported_materials = []

            constraints = {
                "fits_volume": (
                    job_spec['width_mm'] <= p['build_x_mm'] and
                    job_spec['depth_mm'] <= p['build_y_mm'] and
                    job_spec['height_mm'] <= p['build_z_mm']
                ),
                "supports_material": job_spec['material'] in supported_materials,
                "supports_colors": (
                    job_spec.get('color_count', 1) <= 1 or 
                    (p['multicolor_enabled'] and job_spec['color_count'] <= (p['max_colors'] or 1))
                )
            }
            
            is_eligible = all(constraints.values())
            if not is_eligible:
                continue
                
            eligible_ids.append(p['id'])
            
            # 2. Scoring
            scores = {}
            
            # Reliability Score (0-30 points)
            scores['reliability'] = round(p['reliability_score'] * w['reliability'], 1)
            
            # Urgency Match (0-20 points)
            scores['urgency_match'] = 0
            if job_spec.get('priority') == 'urgent' and p['speed_tier'] == 'fast':
                scores['urgency_match'] = w['urgency_match']
            elif job_spec.get('priority') == 'urgent' and p['speed_tier'] == 'normal':
                scores['urgency_match'] = w['urgency_match'] / 2
            elif job_spec.get('priority') == 'normal' and p['speed_tier'] == 'normal':
                scores['urgency_match'] = w['urgency_match'] / 2
                
            # Right-sizing (0-20 points)
            # Penalize using a huge printer for a tiny part
            printer_vol = p['build_x_mm'] * p['build_y_mm'] * p['build_z_mm']
            job_vol = job_spec.get('width_mm', 0) * job_spec.get('depth_mm', 0) * job_spec.get('height_mm', 0)
            vol_ratio = job_vol / printer_vol if printer_vol > 0 else 0
            
            if vol_ratio > 0.5: scores['right_sizing'] = w['right_sizing']
            elif vol_ratio > 0.2: scores['right_sizing'] = w['right_sizing'] * 0.75
            elif vol_ratio > 0.05: scores['right_sizing'] = w['right_sizing'] * 0.5
            else: scores['right_sizing'] = w['right_sizing'] * 0.25

            # 3. Smart Factors
            
            # Queue Depth (0-20 points)
            queue_count = p.get('active_jobs_count', 0)
            if queue_count == 0: scores['queue_depth'] = w['queue_depth']
            elif queue_count == 1: scores['queue_depth'] = w['queue_depth'] * 0.75
            elif queue_count <= 3: scores['queue_depth'] = w['queue_depth'] * 0.5
            else: scores['queue_depth'] = 0

            # Quality Match (0-10 points)
            if job_spec.get('requires_precision') and p.get('is_precision'):
                scores['quality_match'] = w['quality_match']
            else:
                scores['quality_match'] = w['quality_match'] / 2
            
            total_score = sum(scores.values())
            
            results.append({
                "printer_id": p['id'],
                "printer_name": p['name'],
                "constraints": constraints,
                "scores": scores,
                "total_score": total_score
            })
            
        if not results:
            return {
                "success": False,
                "explanation": "No printers meet the physical requirements for this job (volume, material, or colors)."
            }
            
        # Sort by total score descending, then printer ID (stable tie-breaker)
        results.sort(key=lambda x: (-x['total_score'], x['printer_id']))
        winner = results[0]
        
        explanation = f"Recommended **{winner['printer_name']}** (Score: {winner['total_score']}):\n"
        explanation += f"- Reliability: {winner['scores']['reliability']} pts\n"
        if winner['scores']['urgency_match'] > 0:
            explanation += f"- Urgency Match: {winner['scores']['urgency_match']} pts\n"
        explanation += f"- Queue Load: {winner['scores']['queue_depth']} pts ({p.get('active_jobs_count', 0)} jobs)\n"
        
        return {
            "success": True,
            "recommended_printer_id": winner['printer_id'],
            "recommended_printer_name": winner['printer_name'],
            "explanation": explanation,
            "full_breakdown": results
        }
