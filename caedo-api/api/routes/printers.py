from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional
from caedoapi.repositories.printers_repo import PrinterRepository
from caedoapi.integrations.octoprint import OctoPrintIntegration
from caedoapi.integrations.moonraker import MoonrakerIntegration

router = APIRouter()

def get_integration(printer: dict):
    api_type = printer.get('api_type', 'none')
    url = printer.get('api_url')
    key = printer.get('api_key')
    
    if api_type == 'octoprint' and url and key:
        return OctoPrintIntegration(url, key)
    elif api_type == 'moonraker' and url:
        return MoonrakerIntegration(url, key)
    return None

@router.get("/{printer_id}/status")
async def get_printer_status(printer_id: int):
    printer = PrinterRepository.get_by_id(printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
    
    integration = get_integration(printer)
    if not integration:
        return {"success": True, "status": printer.get("current_status", "offline"), "temps": {"tool0": 0, "bed": 0}}
    
    status = await integration.get_status()
    return status

@router.post("/{printer_id}/test")
async def test_printer_connection(printer_id: int):
    printer = PrinterRepository.get_by_id(printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
    
    integration = get_integration(printer)
    if not integration:
        raise HTTPException(status_code=400, detail="Printer has no API configuration")
    
    status = await integration.get_status()
    return status

@router.post("/{printer_id}/pause")
async def pause_printer(printer_id: int):
    printer = PrinterRepository.get_by_id(printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
    integration = get_integration(printer)
    if not integration:
        raise HTTPException(status_code=400, detail="Printer has no API configuration")
    return await integration.pause_job()

@router.post("/{printer_id}/resume")
async def resume_printer(printer_id: int):
    printer = PrinterRepository.get_by_id(printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
    integration = get_integration(printer)
    if not integration:
        raise HTTPException(status_code=400, detail="Printer has no API configuration")
    return await integration.resume_job()

@router.post("/{printer_id}/cancel")
async def cancel_printer(printer_id: int):
    printer = PrinterRepository.get_by_id(printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
    integration = get_integration(printer)
    if not integration:
        raise HTTPException(status_code=400, detail="Printer has no API configuration")
    return await integration.cancel_job()

class PrinterBase(BaseModel):
    name: str
    build_x_mm: float
    build_y_mm: float
    build_z_mm: float
    supports_materials_json: Optional[str] = '["PLA"]'
    multicolor_enabled: bool = False
    max_colors: Optional[int] = None
    speed_tier: str = 'normal'
    reliability_score: float = 0.9
    api_type: str = 'none'
    api_url: Optional[str] = None
    api_key: Optional[str] = None
    ip_address: Optional[str] = None
    notes: Optional[str] = None

class PrinterCreate(PrinterBase):
    pass

class PrinterUpdate(PrinterBase):
    id: int

@router.get("/", response_model=List[dict])
async def get_printers():
    return PrinterRepository.get_all()

@router.get("/{printer_id}")
async def get_printer(printer_id: int):
    printer = PrinterRepository.get_by_id(printer_id)
    if not printer:
        raise HTTPException(status_code=404, detail="Printer not found")
    return printer

@router.post("/")
async def create_printer(printer: PrinterCreate):
    try:
        new_printer_id = PrinterRepository.create(printer.dict())
        return {"id": new_printer_id, "message": "Printer created"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.put("/{printer_id}")
async def update_printer(printer_id: int, printer: PrinterUpdate):
    try:
        PrinterRepository.update(printer_id, printer.dict())
        return {"message": "Printer updated"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.delete("/{printer_id}")
async def delete_printer(printer_id: int):
    try:
        PrinterRepository.delete(printer_id)
        return {"message": "Printer deleted"}
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

