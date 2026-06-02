import sys
import os

# Add project root to path
sys.path.append(os.path.abspath(os.curdir))

from caedoapi.repositories.printers_repo import PrinterRepository

def seed_defaults():
    defaults = [
        {
            "name": "Kobra s1",
            "build_x_mm": 220,
            "build_y_mm": 220,
            "build_z_mm": 250,
            "supports_materials_json": ["PLA", "PETG", "TPU"],
            "multicolor_enabled": False,
            "max_colors": 1,
            "speed_tier": "normal",
            "reliability_score": 0.85,
            "notes": "Standard farm printer"
        },
        {
            "name": "Kobra 3",
            "build_x_mm": 250,
            "build_y_mm": 250,
            "build_z_mm": 260,
            "supports_materials_json": ["PLA", "PETG", "TPU", "ABS"],
            "multicolor_enabled": True,
            "max_colors": 4,
            "speed_tier": "fast",
            "reliability_score": 0.9,
            "notes": "Multicolor workhorse"
        },
        {
            "name": "Kobra 3 max",
            "build_x_mm": 420,
            "build_y_mm": 420,
            "build_z_mm": 500,
            "supports_materials_json": ["PLA", "PETG", "TPU", "ABS", "ASA"],
            "multicolor_enabled": True,
            "max_colors": 4,
            "speed_tier": "fast",
            "reliability_score": 0.88,
            "notes": "Large format builds"
        }
    ]
    
    existing = [p['name'].lower() for p in PrinterRepository.get_all()]
    for d in defaults:
        if d['name'].lower() not in existing:
            PrinterRepository.create(d)
            print(f"Added {d['name']}")
        else:
            print(f"{d['name']} already exists")

if __name__ == "__main__":
    seed_defaults()
