import pytest
from fastapi.testclient import TestClient

def test_get_jobs_empty(client: TestClient):
    response = client.get("/api/jobs/")
    assert response.status_code == 200
    assert response.json() == []

def test_create_job(client: TestClient):
    # First, we need a printer to reference
    # Let's seed a printer directly via repo or just use the API if possible
    # But wait, printers repo/route might not be fully tested yet.
    # I'll create a printer first.
    printer_data = {
        "name": "Test Printer",
        "build_x_mm": 200,
        "build_y_mm": 200,
        "build_z_mm": 200,
        "supports_materials_json": '["PLA"]',
        "reliability_score": 0.95
    }
    from caedoapi.repositories.printers_repo import PrinterRepository
    printer_id = PrinterRepository.create(printer_data)

    job_data = {
        "name": "Test Job",
        "source": "personal",
        "priority": "normal",
        "material": "PLA",
        "weight_g": 50.0,
        "estimated_minutes": 120,
        "width_mm": 50,
        "depth_mm": 50,
        "height_mm": 50,
        "recommended_printer_id": printer_id,
        "recommended_reason_json": {"reason": "fits"}
    }
    
    # Note: The jobs router expects JobCreate which inherits JobBase.
    # I need to check the schema in api/routes/jobs.py
    
    response = client.post("/api/jobs/", json=job_data)
    assert response.status_code == 200
    assert "id" in response.json()
    job_id = response.json()["id"]

    # Verify job was created
    response = client.get(f"/api/jobs/{job_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "Test Job"

def test_update_job_status(client: TestClient):
    # Create a printer and job
    from caedoapi.repositories.printers_repo import PrinterRepository
    printer_id = PrinterRepository.create({"name": "P2", "build_x_mm": 100, "build_y_mm": 100, "build_z_mm": 100})
    
    from caedoapi.repositories.jobs_repo import JobsRepository
    job_id = JobsRepository.create({
        "name": "Status Test", "width_mm": 10, "depth_mm": 10, "height_mm": 10,
        "material": "PLA", "recommended_printer_id": printer_id,
        "recommended_reason_json": {}
    })

    # Update status to printing
    response = client.patch(f"/api/jobs/{job_id}/status?status=printing")
    assert response.status_code == 200
    
    # Verify status change
    response = client.get(f"/api/jobs/{job_id}")
    assert response.json()["status"] == "printing"
    assert response.json()["started_at"] is not None

def test_create_job_invalid_data(client: TestClient):
    # Missing required fields like width_mm
    job_data = {
        "name": "Invalid Job",
        "material": "PLA"
    }
    response = client.post("/api/jobs/", json=job_data)
    assert response.status_code == 422 # Pydantic validation error

def test_update_job_status_invalid_job(client: TestClient):
    response = client.patch("/api/jobs/9999/status?status=printing")
    assert response.status_code == 404 # Not found

