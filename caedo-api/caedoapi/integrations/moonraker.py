import httpx
import logging
import json
import asyncio
import inspect
from typing import Dict, Any, Optional
from .base import PrinterIntegration

logger = logging.getLogger(__name__)

class MoonrakerIntegration(PrinterIntegration):
    """
    Klipper/Moonraker integration using JSON-RPC over HTTP (simplified).
    Full real-time would use WebSockets, but for status checks HTTP is sufficient.
    """
    
    async def get_status(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                # Query multiple objects in one request
                params = {
                    "objects": {
                        "print_stats": None,
                        "extruder": None,
                        "heater_bed": None,
                        "toolhead": None
                    }
                }
                response = await client.get(
                    f"{self.url}/printer/objects/query",
                    params={"print_stats": "", "extruder": "", "heater_bed": "", "toolhead": ""},
                    timeout=5.0
                )
                
                if response.status_code == 200:
                    response_data = response.json()
                    if inspect.isawaitable(response_data):
                        response_data = await response_data
                    data = response_data.get("result", {}).get("status", {})
                    state = data.get("print_stats", {}).get("state", "Unknown")
                    temps = {
                        "tool0": data.get("extruder", {}).get("temperature", 0),
                        "bed": data.get("heater_bed", {}).get("temperature", 0)
                    }
                    return {
                        "success": True,
                        "status": state,
                        "temps": temps
                    }
                else:
                    return {"success": False, "error": f"HTTP {response.status_code}"}
            except Exception as e:
                logger.error(f"Moonraker status error at {self.url}: {str(e)}")
                return {"success": False, "error": str(e)}

    async def submit_job(self, file_path: str, filename: str) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            try:
                with open(file_path, "rb") as f:
                    files = {"file": (filename, f)}
                    # Upload to gcodes
                    upload_resp = await client.post(
                        f"{self.url}/server/files/upload",
                        files=files,
                        timeout=60.0
                    )
                
                if upload_resp.status_code == 201 or upload_resp.status_code == 200:
                    # Start print
                    start_resp = await client.post(
                        f"{self.url}/printer/print/start",
                        params={"filename": filename}
                    )
                    return {"success": start_resp.status_code == 200, "upload": upload_resp.json()}
                else:
                    return {"success": False, "error": upload_resp.text}
            except Exception as e:
                logger.error(f"Moonraker upload error at {self.url}: {str(e)}")
                return {"success": False, "error": str(e)}

    async def cancel_job(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.url}/printer/print/cancel")
            return {"success": response.status_code == 200}

    async def pause_job(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.url}/printer/print/pause")
            return {"success": response.status_code == 200}

    async def resume_job(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(f"{self.url}/printer/print/resume")
            return {"success": response.status_code == 200}
