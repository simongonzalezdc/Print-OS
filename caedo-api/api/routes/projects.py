from fastapi import APIRouter, HTTPException, Body, UploadFile, File
from pydantic import BaseModel
from typing import List, Optional, Dict, Any
import time
import uuid
import os
import shutil
from caedoapi.utils.stl_utils import get_stl_stats, get_3mf_stats

@router.post("/import-stl")
async def import_stl(file: UploadFile = File(...)):
    """
    Import an STL or 3MF file with size limits and analysis.
    """
    extension = os.path.splitext(file.filename)[1].lower()
    if extension not in ['.stl', '.3mf']:
        raise HTTPException(status_code=400, detail="Only .stl and .3mf files are supported")

    # Enforce 25MB limit for 3D meshes in solo-operator mode
    MAX_SIZE = 25 * 1024 * 1024
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=extension) as tmp:
        temp_path = tmp.name
        
    try:
        size = 0
        with open(temp_path, "wb") as buffer:
            while chunk := await file.read(8192):
                size += len(chunk)
                if size > MAX_SIZE:
                    raise HTTPException(status_code=413, detail="File too large (max 25MB)")
                buffer.write(chunk)
        
        if extension == '.stl':
            stats = get_stl_stats(temp_path)
        else:
            stats = get_3mf_stats(temp_path)
        
        # Use AI to generate parametric JSCAD based on stats
        # We also pass the filename which often contains clues about the object
        prompt = f"""
        User uploaded a 3D mesh file: {file.filename}
        Stats:
        - Bounding Box Size: {stats['bbox']['size']} mm
        - Total Volume: {stats['volume']} mm^3
        
        Your task is to generate PARAMETRIC JSCAD code that recreates this object's basic form.
        Don't just use a polyhedron - try to derive the logical primitives (e.g., if it's a box shape, use cuboid).
        If the filename suggests a specific object (like 'gear' or 'bracket'), use your knowledge of those objects to make the code more functional.
        """
        
        messages = [
            {"role": "system", "content": "You are an expert at reverse-engineering 3D meshes into parametric JSCAD code. Focus on clean, editable parameters."},
            {"role": "user", "content": prompt}
        ]
        
        # We use stream_chat but collect the result for non-streaming response here for simplicity
        # or we could return a task_id if it's long.
        full_code = ""
        for chunk in ai_client.stream_chat(messages):
            full_code += chunk
            
        return {
            "success": True,
            "filename": file.filename,
            "stats": stats,
            "suggestedCode": full_code
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(temp_path):
            os.remove(temp_path)

class ProjectSync(BaseModel):
    id: str
    name: str
    description: Optional[str] = None
    objects: Optional[List[Dict[str, Any]]] = None
    settings: Optional[Dict[str, Any]] = None
    delta: Optional[List[Dict[str, Any]]] = None
    isDelta: Optional[bool] = False
    createdAt: Optional[int] = None
    updatedAt: int

@router.post("/{project_id}/sync")
async def sync_project(project_id: str, project: ProjectSync):
    """
    Sync project data to the cloud.
    In production, this saves metadata to the database and 
    large mesh data/project JSON to S3/R2.
    """
    try:
        # Mocking storage logic
        version_id = str(uuid.uuid4())[:8]
        
        # Log to events system if available
        from caedoapi.repositories.events_repo import EventsRepository
        # Mock event for project sync
        
        return {
            "success": True, 
            "project_id": project_id,
            "version": version_id,
            "timestamp": int(time.time() * 1000)
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{project_id}")
async def get_project(project_id: str):
    """Fetch project data from cloud storage."""
    # Placeholder: In a real app, fetch from DB/S3
    raise HTTPException(status_code=404, detail="Project not found in cloud storage")

@router.get("/")
async def list_projects():
    """List projects available in the cloud for the current user."""
    # Placeholder: Filter by user_id in production
    return []

@router.get("/{project_id}/versions")
async def list_versions(project_id: str):
    """List historical versions of a project."""
    return [
        {"version": "v1", "timestamp": int(time.time() * 1000) - 86400000},
        {"version": "v2", "timestamp": int(time.time() * 1000)}
    ]

@router.post("/{project_id}/restore/{version}")
async def restore_version(project_id: str, version: str):
    """Restore a project to a specific historical version."""
    # In production, this would swap the current project JSON with the versioned one in S3
    return {
        "success": True, 
        "project_id": project_id, 
        "restored_to": version,
        "timestamp": int(time.time() * 1000)
    }

