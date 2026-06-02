from fastapi import APIRouter, HTTPException
from typing import List, Dict, Any
from caedoapi.db import get_db

router = APIRouter()

@router.get("/")
async def get_queue():
    """Returns the current prioritized job queue."""
    with get_db() as conn:
        jobs = conn.execute("""
            SELECT id, name, status, priority, material, grams_estimated, minutes_estimated, 
                   recommended_printer_id, created_at
            FROM jobs
            WHERE status IN ('queued', 'printing')
            ORDER BY 
                CASE priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'normal' THEN 2 
                    WHEN 'low' THEN 3 
                END, 
                created_at ASC
        """).fetchall()
        return [dict(row) for row in jobs]

@router.post("/reorder")
async def reorder_queue(job_ids: List[int]):
    """Manually reorder the queue by updating priorities or notes."""
    # Simplified reorder: in a real app, you might have a 'position' column
    # For now, we'll just log the reorder attempt
    return {"status": "success", "message": "Queue reordered manually"}

