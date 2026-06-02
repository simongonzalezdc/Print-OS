import pytest
from caedoapi.domain.states import can_transition, validate_transition

def test_can_transition_valid():
    assert can_transition("queued", "printing") is True
    assert can_transition("queued", "canceled") is True
    assert can_transition("printing", "completed") is True
    assert can_transition("printing", "failed") is True
    assert can_transition("printing", "canceled") is True

def test_can_transition_invalid():
    assert can_transition("queued", "completed") is False
    assert can_transition("completed", "printing") is False
    assert can_transition("failed", "queued") is False
    assert can_transition("canceled", "queued") is False
    assert can_transition("non_existent", "queued") is False

def test_validate_transition_invalid_transition():
    success, message = validate_transition("queued", "completed")
    assert success is False
    assert "Invalid state transition" in message

def test_validate_transition_completed_missing_data():
    # Missing entire data dict
    success, message = validate_transition("printing", "completed")
    assert success is False
    assert "Completion requires actual grams and minutes" in message
    
    # Missing one field
    success, message = validate_transition("printing", "completed", {"grams_actual": 10.0})
    assert success is False
    assert "Completion requires actual grams and minutes" in message

def test_validate_transition_completed_valid():
    data = {"grams_actual": 15.5, "minutes_actual": 45}
    success, message = validate_transition("printing", "completed", data)
    assert success is True
    assert message == ""

def test_validate_transition_failed_missing_reason():
    success, message = validate_transition("printing", "failed")
    assert success is False
    assert "Failure requires a reason" in message
    
    success, message = validate_transition("printing", "failed", {})
    assert success is False
    assert "Failure requires a reason" in message

def test_validate_transition_failed_valid():
    data = {"failure_reason": "Nozzle clog"}
    success, message = validate_transition("printing", "failed", data)
    assert success is True
    assert message == ""

def test_validate_transition_generic_valid():
    # Simple transition without extra data requirements
    success, message = validate_transition("queued", "printing")
    assert success is True
    assert message == ""

