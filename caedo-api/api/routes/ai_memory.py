from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from caedoapi.repositories.ai_memory_repo import AIMemoryRepository

router = APIRouter()

class MemoryBase(BaseModel):
    category: str
    content: str
    importance: float = 0.5
    source_design_id: Optional[int] = None

class MemoryCreate(MemoryBase):
    pass

@router.get("/", response_model=List[dict])
async def get_memories():
    return AIMemoryRepository.get_all()

@router.post("/")
async def create_memory(memory: MemoryCreate):
    try:
        new_id = AIMemoryRepository.create(memory.dict())
        return {"id": new_id, "message": "Memory added"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{memory_id}")
async def delete_memory(memory_id: int):
    if AIMemoryRepository.delete(memory_id):
        return {"message": "Memory deleted"}
    raise HTTPException(status_code=404, detail="Memory not found")

@router.patch("/{memory_id}/importance")
async def update_importance(memory_id: int, importance: float):
    if AIMemoryRepository.update_importance(memory_id, importance):
        return {"message": "Importance updated"}
    raise HTTPException(status_code=404, detail="Memory not found")
