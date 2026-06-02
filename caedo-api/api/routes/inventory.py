from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from caedoapi.repositories.inventory_repo import InventoryRepository

router = APIRouter()

class InventoryBase(BaseModel):
    material: str
    color: str
    weight_g: float
    cost_per_kg: Optional[float] = None
    min_threshold_g: float = 200.0

class InventoryCreate(InventoryBase):
    pass

@router.get("/", response_model=List[dict])
async def get_inventory():
    return InventoryRepository.get_all()

@router.post("/")
async def create_inventory_item(item: InventoryCreate):
    try:
        new_id = InventoryRepository.create(item.dict())
        return {"id": new_id, "message": "Inventory item added"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{item_id}")
async def delete_inventory_item(item_id: int):
    if InventoryRepository.delete(item_id):
        return {"message": "Item deleted"}
    raise HTTPException(status_code=404, detail="Item not found")

@router.post("/deduct")
async def deduct_material(material: str, color: str, weight_g: float):
    if InventoryRepository.update_weight(material, color, weight_g):
        return {"message": "Material deducted successfully"}
    raise HTTPException(status_code=404, detail="Material/Color combination not found")
