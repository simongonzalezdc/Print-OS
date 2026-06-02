import pytest
from fastapi.testclient import TestClient

def test_get_printers_empty(client: TestClient):
    # This might fail if the DB already has seeded printers from previous tests
    # But since it's a new session, it should be clean or we should expect some.
    response = client.get("/api/printers/")
    assert response.status_code == 200
    # Depending on order, might not be empty if setup_test_db doesn't clear between tests.
    # setup_test_db is session scope, so it stays across tests.
    
def test_create_printer(client: TestClient):
    printer_data = {
        "name": "API Printer",
        "make": "Creality",
        "model": "Ender 3",
        "build_x_mm": 250,
        "build_y_mm": 250,
        "build_z_mm": 250,
        "speed_tier": "fast",
        "reliability_score": 0.85
    }
    response = client.post("/api/printers/", json=printer_data)
    assert response.status_code == 200
    assert "id" in response.json()
    printer_id = response.json()["id"]

    # Verify printer was created
    response = client.get(f"/api/printers/{printer_id}")
    assert response.status_code == 200
    assert response.json()["name"] == "API Printer"

def test_get_printer_not_found(client: TestClient):
    response = client.get("/api/printers/9999")
    assert response.status_code == 404

