import pytest
from fastapi.testclient import TestClient

def test_get_queue_empty(client: TestClient):
    response = client.get("/api/queue/")
    assert response.status_code == 200
    assert response.json() == []

def test_queue_ordering(client: TestClient):
    from caedoapi.repositories.printers_repo import PrinterRepository
    printer_id = PrinterRepository.create({"name": "QP", "build_x_mm": 100, "build_y_mm": 100, "build_z_mm": 100})
    
    from caedoapi.repositories.jobs_repo import JobsRepository
    # Create normal job
    JobsRepository.create({
        "name": "Normal Job", "priority": "normal", "width_mm": 10, "depth_mm": 10, "height_mm": 10,
        "material": "PLA", "recommended_printer_id": printer_id, "recommended_reason_json": {}
    })
    # Create urgent job
    JobsRepository.create({
        "name": "Urgent Job", "priority": "urgent", "width_mm": 10, "depth_mm": 10, "height_mm": 10,
        "material": "PLA", "recommended_printer_id": printer_id, "recommended_reason_json": {}
    })
    
    response = client.get("/api/queue/")
    assert response.status_code == 200
    queue = response.json()
    assert len(queue) >= 2
    # Urgent job should be first due to priority logic in SQL
    assert queue[0]["priority"] == "urgent"
    assert queue[1]["priority"] == "normal"

def test_reorder_queue(client: TestClient):
    response = client.post("/api/queue/reorder", json=[1, 2, 3])
    assert response.status_code == 200
    assert response.json()["status"] == "success"

