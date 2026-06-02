import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

def test_calculate_costs_endpoint(client: TestClient):
    payload = {
        "grams": 100,
        "minutes": 60,
        "material": "PLA",
        "sell_price": 30.0
    }
    response = client.post("/api/business/costs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["success"] is True
    assert "total_cost" in data
    assert "profit" in data

@patch("api.routes.business.ai_client.evaluate_idea")
def test_evaluate_idea_endpoint(mock_eval, client: TestClient):
    mock_eval.return_value = {"viability": "high", "niche": "decor"}
    
    payload = {"idea": "Modern Art Sculpture"}
    response = client.post("/api/business/evaluate", json=payload)
    
    assert response.status_code == 200
    data = response.json()
    assert data["viability"] == "high"

def test_get_forecast(client: TestClient):
    # This might need deeper mocking of material_forecaster
    with patch("caedoapi.services.forecaster.MaterialForecaster.get_forecast") as mock_forecast:
        mock_forecast.return_value = {"PLA": 500}
        response = client.get("/api/business/forecast?days=5")
        assert response.status_code == 200
        assert response.json() == {"PLA": 500}

