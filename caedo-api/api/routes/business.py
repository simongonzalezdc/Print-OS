from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from caedoapi.ai.client import AIClient
from caedoapi.domain.costing import CostingEngine
from caedoapi.repositories.costs_repo import CostsRepository

router = APIRouter()
ai_client = AIClient()

class IdeaEvaluationRequest(BaseModel):
    idea: str
    platform: str = "Etsy"

class CostCalculationRequest(BaseModel):
    grams: float
    minutes: int
    material: str
    sell_price: float

@router.post("/evaluate")
async def evaluate_idea(request: IdeaEvaluationRequest):
    try:
        eval_data = ai_client.evaluate_idea(request.idea, request.platform)
        return eval_data
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/listing")
async def generate_listing(request: IdeaEvaluationRequest):
    try:
        # We need the evaluation data first to generate a good listing
        eval_data = ai_client.evaluate_idea(request.idea, request.platform)
        listing = ai_client.generate_listing(request.idea, request.platform, eval_data)
        return listing
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/costs")
async def calculate_costs(request: CostCalculationRequest):
    try:
        settings = CostsRepository.get_all()
        costs_result = CostingEngine.calculate_costs(
            request.grams, 
            request.minutes, 
            request.material, 
            request.sell_price, 
            settings
        )
        return costs_result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/forecast")
async def get_material_forecast(days: int = 7):
    from caedoapi.services.forecaster import material_forecaster
    return material_forecaster.get_forecast(days)

