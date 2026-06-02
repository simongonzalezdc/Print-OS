from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
from caedoapi.ai.client import AIClient

router = APIRouter()
ai_client = AIClient()

class ChatRequest(BaseModel):
    messages: List[Dict[str, str]]
    context: Optional[Dict[str, Any]] = None

class DesignPromptRequest(BaseModel):
    idea: str
    eval_data: Dict[str, Any]
    conversation_summary: Optional[str] = ""

class OptimizeRequest(BaseModel):
    mesh_stats: Dict[str, Any]
    constraints: Dict[str, Any]

class MarketPredictRequest(BaseModel):
    idea: str
    category: str
    complexity: int

class FailureAnalysisRequest(BaseModel):
    photo_data_url: str
    job_context: Optional[Dict[str, Any]] = None

class BatchRequest(BaseModel):
    prompts: List[str]
    context: Optional[Dict[str, Any]] = None

@router.post("/batch")
async def create_batch(request: BatchRequest):
    from caedoapi.services.batch_processor import batch_processor
    job_id = batch_processor.add_batch_job(request.prompts, request.context)
    return {"job_id": job_id}

@router.get("/batch/{job_id}")
async def get_batch_results(job_id: str):
    from caedoapi.services.batch_processor import batch_processor
    results = batch_processor.get_batch_status(job_id)
    return results

class UsageLogRequest(BaseModel):
    feature: str
    model: str
    prompt_tokens: int
    completion_tokens: int
    client_id: Optional[str] = None
    endpoint: Optional[str] = None
    cost_usd: Optional[float] = None

@router.post("/chat")
async def chat(request: ChatRequest):
    try:
        def stream_response():
            for chunk in ai_client.stream_chat(request.messages, request.context):
                yield chunk
        
        return StreamingResponse(stream_response(), media_type="text/plain")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/memory/extract")
async def extract_memories(request: ChatRequest):
    try:
        from caedoapi.services.memory_service import MemoryService
        memory_service = MemoryService(ai_client)
        count = await memory_service.extract_and_save_memories(request.messages)
        return {"success": True, "count": count}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/usage")
async def log_usage(request: UsageLogRequest):
    try:
        ai_client.log_manual_usage(
            feature=request.feature,
            model=request.model,
            prompt_tokens=request.prompt_tokens,
            completion_tokens=request.completion_tokens,
            client_id=request.client_id,
            endpoint=request.endpoint,
            cost_usd=request.cost_usd
        )
        return {"success": True}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/usage/summary")
async def get_usage_summary():
    from caedoapi.repositories.ai_usage_repo import AIUsageRepository
    return AIUsageRepository.get_summary()

@router.get("/usage/by-day")
async def get_usage_by_day():
    from caedoapi.repositories.ai_usage_repo import AIUsageRepository
    return AIUsageRepository.get_usage_by_day()

@router.get("/usage/by-feature")
async def get_usage_by_feature():
    from caedoapi.repositories.ai_usage_repo import AIUsageRepository
    return AIUsageRepository.get_usage_by_feature()

@router.post("/design-prompt")
async def generate_design_prompt(request: DesignPromptRequest):
    try:
        # Convert dict back to IdeaEvaluation if necessary, 
        # but AIClient.generate_design_prompt handles pydantic objects
        from caedoapi.ai.schemas import IdeaEvaluation
        eval_obj = IdeaEvaluation(**request.eval_data)
        
        prompt = ai_client.generate_design_prompt(
            request.idea, 
            eval_obj, 
            request.conversation_summary
        )
        return prompt
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/optimize")
async def optimize_design(request: OptimizeRequest):
    try:
        # This will use a new method in AIClient
        optimization = ai_client.optimize_design(
            request.mesh_stats, 
            request.constraints
        )
        return optimization
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/market-predict")
async def market_predict(request: MarketPredictRequest):
    try:
        prediction = ai_client.predict_market(
            request.idea, 
            request.category, 
            request.complexity
        )
        return prediction
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/failure-diagnostics")
async def analyze_failure(request: FailureAnalysisRequest):
    try:
        analysis = ai_client.analyze_failure_photo(
            request.photo_data_url,
            request.job_context
        )
        return analysis
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
