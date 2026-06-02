import pytest
from caedoapi.domain.costing import CostingEngine

def test_calculate_costs_basic():
    settings = {
        "filament_usd_per_kg": {"PLA": 20.0},
        "electricity_usd_per_kwh": 0.12,
        "printer_kwh_per_hour": 0.15,
        "labor_usd_per_hour": 10.0,
        "depreciation_usd_per_hour": 0.10,
        "platform_fee_pct": 0.10,
        "packaging_usd_per_order": 1.0
    }
    
    # 100g PLA, 60 mins, $30 sell price
    result = CostingEngine.calculate_costs(
        grams=100.0,
        minutes=60.0,
        material="PLA",
        sell_price=30.0,
        settings=settings
    )
    
    # Material: 0.1kg * $20 = $2.0
    # Elec: 1hr * 0.15kwh * $0.12 = $0.018
    # Labor: 5/60 hr * $10 = $0.8333...
    # Depr: 1hr * $0.10 = $0.10
    # Pack: $1.0
    # Fee: $30 * 0.10 = $3.0
    # Total: 2 + 0.018 + 0.8333333333333334 + 0.1 + 1 + 3 = 6.951333333333333
    
    expected_total = 6.951333333333333
    # Update to accommodate the round(..., 2) in the implementation
    assert result["total_cost"] == pytest.approx(expected_total, abs=0.01)
    assert result["profit"] == pytest.approx(30.0 - expected_total, abs=0.01)
    # Implementation returns margin as percentage (e.g. 76.8)
    assert result["margin"] == pytest.approx((30.0 - expected_total) / 30.0 * 100, abs=0.1)

def test_calculate_costs_negative_input():
    result = CostingEngine.calculate_costs(
        grams=-10.0,
        minutes=60.0,
        material="PLA",
        sell_price=30.0,
        settings={}
    )
    assert result["success"] is False
    assert result["error_code"] == "INVALID_INPUT"

def test_calculate_costs_warnings():
    settings = {
        "filament_usd_per_kg": {"PLA": 100.0}, # Very expensive
        "platform_fee_pct": 0.5 # Huge fee
    }
    
    # Sell for $10, but costs will be high
    result = CostingEngine.calculate_costs(
        grams=500.0, # 0.5kg * 100 = $50
        minutes=60.0,
        material="PLA",
        sell_price=10.0,
        settings=settings
    )
    
    assert result["success"] is True
    assert result["profit"] < 0
    assert any("UNPROFITABLE" in w for w in result["warnings"])
    assert any("Low margin" in w for w in result["warnings"])
