import json
from typing import Dict, Any

class Factory:
    @staticmethod
    def printer(overrides: Dict[str, Any] = None) -> Dict[str, Any]:
        data = {
            "name": "Factory Printer",
            "make": "Generic",
            "model": "Model X",
            "build_x_mm": 200,
            "build_y_mm": 200,
            "build_z_mm": 200,
            "supports_materials_json": json.dumps(["PLA"]),
            "multicolor_enabled": 0,
            "max_colors": 1,
            "speed_tier": "normal",
            "reliability_score": 0.9,
            "notes": "Factory seeded printer"
        }
        if overrides:
            data.update(overrides)
        return data

    @staticmethod
    def job(overrides: Dict[str, Any] = None) -> Dict[str, Any]:
        data = {
            "name": "Factory Job",
            "source": "personal",
            "width_mm": 100,
            "depth_mm": 100,
            "height_mm": 100,
            "material": "PLA",
            "color_count": 1,
            "grams_estimated": 50.0,
            "minutes_estimated": 120,
            "priority": "normal",
            "status": "queued",
            "recommended_printer_id": 1,
            "recommended_reason_json": {"reason": "Default factory reasoning"}
        }
        if overrides:
            data.update(overrides)
        return data

