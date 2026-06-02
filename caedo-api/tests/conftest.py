import os
import sys

# Set environment variable BEFORE any imports
os.environ["PFOS_DB_PATH"] = "test_farm.db"

import pytest
from unittest.mock import MagicMock, patch

# Mock AIClient before importing the app
with patch("caedoapi.ai.client.AIClient"):
    from api.main import app

from fastapi.testclient import TestClient
from caedoapi.db import init_db

@pytest.fixture(scope="function", autouse=True)
def setup_test_db():
    # Ensure clean database for each test
    if os.path.exists("test_farm.db"):
        os.remove("test_farm.db")
    init_db()
    yield
    if os.path.exists("test_farm.db"):
        try:
            os.remove("test_farm.db")
        except PermissionError:
            pass

@pytest.fixture
def client():
    return TestClient(app)
