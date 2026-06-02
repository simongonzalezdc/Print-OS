import pytest
from unittest.mock import AsyncMock, patch
from caedoapi.integrations.octoprint import OctoPrintIntegration
from caedoapi.integrations.moonraker import MoonrakerIntegration

@pytest.mark.asyncio
async def test_octoprint_status_mock():
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "state": {"text": "Operational"},
            "temperature": {
                "tool0": {"actual": 200.0},
                "bed": {"actual": 60.0}
            }
        }
        
        integration = OctoPrintIntegration("http://localhost:5000", "test-key")
        status = await integration.get_status()
        
        assert status["success"] is True
        assert status["status"] == "Operational"
        assert status["temps"]["tool0"] == 200.0

@pytest.mark.asyncio
async def test_moonraker_status_mock():
    with patch("httpx.AsyncClient.get") as mock_get:
        mock_get.return_value.status_code = 200
        mock_get.return_value.json.return_value = {
            "result": {
                "status": {
                    "print_stats": {"state": "ready"},
                    "extruder": {"temperature": 210.0},
                    "heater_bed": {"temperature": 65.0}
                }
            }
        }
        
        integration = MoonrakerIntegration("http://localhost:7125")
        status = await integration.get_status()
        
        assert status["success"] is True
        assert status["status"] == "ready"
        assert status["temps"]["tool0"] == 210.0
