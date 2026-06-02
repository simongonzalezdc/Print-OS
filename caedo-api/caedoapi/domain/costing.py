from typing import Dict, Any

class CostingEngine:
    COSTING_DEFAULTS = {
        "labor_setup_minutes": 5.0,
        "electricity_rate": 0.12,
        "power_usage": 0.15,
        "filament_price": 20.0,
        "depreciation_rate": 0.10,
        "packaging_fee": 1.50,
        "platform_fee_pct": 0.13
    }

    @staticmethod
    def calculate_costs(
        grams: float,
        minutes: float,
        material: str,
        sell_price: float,
        settings: Dict[str, Any]
    ) -> Dict[str, Any]:
        """
        Calculates a full cost breakdown based on settings and print estimates.
        """
        # 0. Input Validation
        if grams < 0 or minutes < 0 or sell_price < 0:
            return {
                "success": False,
                "error_code": "INVALID_INPUT",
                "error_message": "Negative values are not allowed for grams, minutes, or price."
            }

        # 1. Material Cost
        mat_costs = settings.get('filament_usd_per_kg', {})
        usd_per_kg = mat_costs.get(material, CostingEngine.COSTING_DEFAULTS["filament_price"])
        material_cost = round(grams * (usd_per_kg / 1000), 2)
        
        # 2. Electricity
        kwh_rate = settings.get('electricity_usd_per_kwh', CostingEngine.COSTING_DEFAULTS["electricity_rate"])
        power_usage = settings.get('printer_kwh_per_hour', CostingEngine.COSTING_DEFAULTS["power_usage"])
        electricity_cost = round((minutes / 60) * power_usage * kwh_rate, 2)
        
        # 3. Labor
        labor_rate = settings.get('labor_usd_per_hour', 0.0)
        setup_minutes = settings.get('labor_setup_minutes_per_job', CostingEngine.COSTING_DEFAULTS["labor_setup_minutes"])
        labor_cost = round((setup_minutes / 60) * labor_rate, 2) if labor_rate > 0 else 0
        
        # 4. Depreciation
        dep_rate = settings.get('depreciation_usd_per_hour', CostingEngine.COSTING_DEFAULTS["depreciation_rate"])
        depreciation_cost = round((minutes / 60) * dep_rate, 2)
        
        # 5. Fixed Fees
        packaging = settings.get('packaging_usd_per_order', CostingEngine.COSTING_DEFAULTS["packaging_fee"])
        platform_fee_pct = settings.get('platform_fee_pct', CostingEngine.COSTING_DEFAULTS["platform_fee_pct"])
        platform_fee = round(sell_price * platform_fee_pct, 2)
        
        total_cost = round(material_cost + electricity_cost + labor_cost + depreciation_cost + packaging + platform_fee, 2)
        profit = round(sell_price - total_cost, 2)
        margin = round((profit / sell_price * 100), 1) if sell_price > 0 else 0
        
        warnings = []
        if margin < 20 and sell_price > 0:
            warnings.append("Low margin (<20%). Consider raising price or optimizing design.")
        if total_cost > sell_price:
            warnings.append("Job is UNPROFITABLE at current sell price.")

        return {
            "success": True,
            "costs": {
                "material": material_cost,
                "electricity": electricity_cost,
                "labor": labor_cost,
                "depreciation": depreciation_cost,
                "packaging": packaging,
                "platform_fee": platform_fee
            },
            "total_cost": total_cost,
            "profit": profit,
            "margin": margin,
            "warnings": warnings,
            "formula_vars": {
                "usd_per_kg": usd_per_kg,
                "kwh_rate": kwh_rate,
                "power_usage": power_usage,
                "platform_fee_pct": platform_fee_pct
            }
        }
