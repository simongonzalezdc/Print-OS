import pytest
import json
from caedoapi.domain.routing import RoutingEngine

@pytest.fixture
def sample_job():
    return {
        "width_mm": 50,
        "depth_mm": 50,
        "height_mm": 50,
        "material": "PLA",
        "priority": "normal",
        "color_count": 1,
        "requires_precision": False
    }

@pytest.fixture
def sample_printers():
    return [
        {
            "id": 1,
            "name": "Small Printer",
            "build_x_mm": 100,
            "build_y_mm": 100,
            "build_z_mm": 100,
            "supports_materials_json": json.dumps(["PLA"]),
            "multicolor_enabled": False,
            "max_colors": 1,
            "reliability_score": 0.9,
            "speed_tier": "normal",
            "active_jobs_count": 0,
            "is_precision": False
        },
        {
            "id": 2,
            "name": "Large Fast Printer",
            "build_x_mm": 300,
            "build_y_mm": 300,
            "build_z_mm": 300,
            "supports_materials_json": json.dumps(["PLA", "PETG"]),
            "multicolor_enabled": True,
            "max_colors": 4,
            "reliability_score": 0.8,
            "speed_tier": "fast",
            "active_jobs_count": 1,
            "is_precision": True
        }
    ]

def test_routing_no_eligible_printers(sample_job):
    # Job too big for any printer
    big_job = sample_job.copy()
    big_job["width_mm"] = 500
    
    printers = [
        {
            "id": 1,
            "name": "Tiny",
            "build_x_mm": 10,
            "build_y_mm": 10,
            "build_z_mm": 10,
            "supports_materials_json": json.dumps(["PLA"]),
            "multicolor_enabled": False,
            "max_colors": 1
        }
    ]
    
    result = RoutingEngine.get_recommendation(big_job, printers)
    assert result["success"] is False
    assert "No printers meet the physical requirements" in result["explanation"]

def test_routing_material_mismatch(sample_job, sample_printers):
    # Material not supported
    exotic_job = sample_job.copy()
    exotic_job["material"] = "ABS"
    
    result = RoutingEngine.get_recommendation(exotic_job, sample_printers)
    assert result["success"] is False

def test_routing_scoring_reliability(sample_job):
    # Test that reliability score impacts ranking
    p1 = {
        "id": 1, "name": "Reliable", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 1.0, "speed_tier": "normal", "active_jobs_count": 0
    }
    p2 = {
        "id": 2, "name": "Unreliable", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.5, "speed_tier": "normal", "active_jobs_count": 0
    }
    
    result = RoutingEngine.get_recommendation(sample_job, [p1, p2])
    assert result["recommended_printer_id"] == 1
    assert result["full_breakdown"][0]["scores"]["reliability"] > result["full_breakdown"][1]["scores"]["reliability"]

def test_routing_urgency_match(sample_job):
    urgent_job = sample_job.copy()
    urgent_job["priority"] = "urgent"
    
    p_slow = {
        "id": 1, "name": "Slow", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "normal", "active_jobs_count": 0
    }
    p_fast = {
        "id": 2, "name": "Fast", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "fast", "active_jobs_count": 0
    }
    
    result = RoutingEngine.get_recommendation(urgent_job, [p_slow, p_fast])
    assert result["recommended_printer_id"] == 2
    assert result["full_breakdown"][0]["scores"]["urgency_match"] == 20

def test_routing_right_sizing(sample_job):
    # Small job should prefer small printer over giant one if all else equal
    p_small = {
        "id": 1, "name": "Small", "build_x_mm": 60, "build_y_mm": 60, "build_z_mm": 60,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "normal", "active_jobs_count": 0
    }
    p_large = {
        "id": 2, "name": "Large", "build_x_mm": 500, "build_y_mm": 500, "build_z_mm": 500,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "normal", "active_jobs_count": 0
    }
    
    result = RoutingEngine.get_recommendation(sample_job, [p_small, p_large])
    # vol_ratio for p_small: (50*50*50) / (60*60*60) = 125000 / 216000 = 0.57 (> 0.5) -> 20 pts
    # vol_ratio for p_large: (50*50*50) / (500*500*500) = 125000 / 125000000 = 0.001 (< 0.05) -> 5 pts
    assert result["recommended_printer_id"] == 1
    assert result["full_breakdown"][0]["scores"]["right_sizing"] == 20
    assert result["full_breakdown"][1]["scores"]["right_sizing"] == 5

def test_routing_queue_depth(sample_job):
    p_empty = {
        "id": 1, "name": "Empty", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "normal", "active_jobs_count": 0
    }
    p_busy = {
        "id": 2, "name": "Busy", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "normal", "active_jobs_count": 5
    }
    
    result = RoutingEngine.get_recommendation(sample_job, [p_empty, p_busy])
    assert result["recommended_printer_id"] == 1
    assert result["full_breakdown"][0]["scores"]["queue_depth"] == 20
    assert result["full_breakdown"][1]["scores"]["queue_depth"] == 0

def test_routing_quality_match(sample_job):
    precision_job = sample_job.copy()
    precision_job["requires_precision"] = True
    
    p_normal = {
        "id": 1, "name": "Normal", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "normal", "active_jobs_count": 0,
        "is_precision": False
    }
    p_precision = {
        "id": 2, "name": "Precision", "build_x_mm": 200, "build_y_mm": 200, "build_z_mm": 200,
        "supports_materials_json": json.dumps(["PLA"]), "multicolor_enabled": False,
        "reliability_score": 0.9, "speed_tier": "normal", "active_jobs_count": 0,
        "is_precision": True
    }
    
    result = RoutingEngine.get_recommendation(precision_job, [p_normal, p_precision])
    assert result["recommended_printer_id"] == 2
    assert result["full_breakdown"][0]["scores"]["quality_match"] == 10

