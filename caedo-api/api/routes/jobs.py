from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Optional, Any
from datetime import datetime
from caedoapi.repositories.jobs_repo import JobsRepository

router = APIRouter()

class JobBase(BaseModel):
    name: str
    source: str = "personal"
    priority: str = "normal"
    material: str
    width_mm: float
    depth_mm: float
    height_mm: float
    weight_g: Optional[float] = None
    estimated_minutes: Optional[int] = None
    status: str = "queued"
    recommended_printer_id: Optional[int] = None
    recommended_reason_json: Optional[Any] = None
    assigned_printer_id: Optional[int] = None
    notes: Optional[str] = None

class JobCreate(JobBase):
    pass

@router.get("/", response_model=List[dict])
async def get_jobs():
    return JobsRepository.get_all()

@router.get("/{job_id}")
async def get_job(job_id: int):
    job = JobsRepository.get_by_id(job_id)
    if not job:
        raise HTTPException(status_code=404, detail="Job not found")
    return job

@router.post("/")
async def create_job(job: JobCreate):
    try:
        # Map weight_g to grams_estimated and estimated_minutes to minutes_estimated if needed
        data = job.dict()
        if 'weight_g' in data and data['weight_g'] is not None:
            data['grams_estimated'] = data.pop('weight_g')
        if 'estimated_minutes' in data and data['estimated_minutes'] is not None:
            data['minutes_estimated'] = data.pop('estimated_minutes')
            
        new_job_id = JobsRepository.create(data)
        return {"id": new_job_id, "message": "Job created"}
    except Exception as e:
        import traceback
        print(traceback.format_exc())
        raise HTTPException(status_code=400, detail=str(e))

@router.patch("/{job_id}/status")
async def update_job_status(job_id: int, status: str):
    try:
        success = JobsRepository.update_status(job_id, status)
        if not success:
            raise HTTPException(status_code=404, detail="Job not found or update failed")
        return {"message": f"Job status updated to {status}"}
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=400, detail=str(e))

@router.get("/{job_id}/predict-risk")
async def predict_job_risk(job_id: int):
    from caedoapi.services.predictor import prediction_service
    prediction = prediction_service.predict_job_failure(job_id)
    if not prediction:
        raise HTTPException(status_code=404, detail="Job not found")
    return prediction

@router.post("/auto-assign")
async def auto_assign_jobs():
    from caedoapi.services.scheduler import scheduling_service
    assignments = scheduling_service.auto_assign_all()
    return assignments
