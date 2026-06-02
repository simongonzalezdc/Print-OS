from fastapi import APIRouter, HTTPException, UploadFile, File, Header
from fastapi.responses import FileResponse
import os
import shutil
import zipfile
import datetime
import tempfile
from ..db import DB_PATH, init_db

router = APIRouter()

# Simple administrative token check for solo-operator hardening
ADMIN_TOKEN = os.getenv("PFOS_ADMIN_TOKEN")

def verify_admin(token: str = Header(None)):
    if ADMIN_TOKEN and token != ADMIN_TOKEN:
        raise HTTPException(status_code=403, detail="Unauthorized administrative action")

@router.get("/backup")
async def create_backup(token: str = Header(None)):
    """
    Creates a backup of the database and returns it as a ZIP file.
    """
    verify_admin(token)
    
    timestamp = datetime.datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_filename = f"caedo_backup_{timestamp}.zip"
    
    try:
        # Create in a temporary location first
        with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
            tmp_path = tmp.name
            
        with zipfile.ZipFile(tmp_path, 'w') as zipf:
            if os.path.exists(DB_PATH):
                zipf.write(DB_PATH, arcname="farm.db")
            
        return FileResponse(
            tmp_path, 
            media_type="application/zip", 
            filename=backup_filename,
            # We would ideally delete this file after it's sent
            # but FileResponse background task is tricky in this context
            # A real production app would use a background task or a separate cleanup job
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/restore")
async def restore_backup(file: UploadFile = File(...), token: str = Header(None)):
    """
    Restores the database from a backup ZIP file with size limits and validation.
    """
    verify_admin(token)
    
    if not file.filename.endswith('.zip'):
        raise HTTPException(status_code=400, detail="Only .zip files are supported")
    
    # Enforce 50MB limit for solo-operator DBs
    MAX_SIZE = 50 * 1024 * 1024
    
    with tempfile.NamedTemporaryFile(delete=False, suffix=".zip") as tmp:
        tmp_path = tmp.name
    
    try:
        size = 0
        with open(tmp_path, "wb") as buffer:
            while chunk := await file.read(8192):
                size += len(chunk)
                if size > MAX_SIZE:
                    raise HTTPException(status_code=413, detail="Backup file too large")
                buffer.write(chunk)
            
        with zipfile.ZipFile(tmp_path, 'r') as zipf:
            if "farm.db" in zipf.namelist():
                # Backup current DB just in case
                if os.path.exists(DB_PATH):
                    shutil.copy2(DB_PATH, DB_PATH + ".bak")
                
                # Extract to temp and then move to correct DB_PATH
                extract_dir = tempfile.mkdtemp()
                zipf.extract("farm.db", path=extract_dir)
                extracted_db = os.path.join(extract_dir, "farm.db")
                
                # Close connection if any? init_db will re-open
                shutil.move(extracted_db, DB_PATH)
                shutil.rmtree(extract_dir)
                
                # Re-initialize or verify
                init_db()
                return {"success": True, "message": "Database restored successfully"}
            else:
                return {"success": False, "message": "ZIP file does not contain farm.db"}
    except HTTPException:
        raise
    except Exception as e:
        # Restore backup if failed
        if os.path.exists(DB_PATH + ".bak"):
            shutil.move(DB_PATH + ".bak", DB_PATH)
        raise HTTPException(status_code=500, detail=str(e))
    finally:
        if os.path.exists(tmp_path):
            os.remove(tmp_path)
