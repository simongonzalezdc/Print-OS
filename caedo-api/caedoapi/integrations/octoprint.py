import httpx
import logging
import inspect
from typing import Dict, Any, Optional
from .base import PrinterIntegration

logger = logging.getLogger(__name__)

class OctoPrintIntegration(PrinterIntegration):
    def __init__(self, url: str, api_key: str):
        super().__init__(url, api_key)
        self.headers = {"X-Api-Key": self.api_key}

    async def get_status(self) -> Dict[str, Any]:
        """
        Fetches status from OctoPrint REST API.
        """
        async with httpx.AsyncClient() as client:
            try:
                # Get printer status
                response = await client.get(f"{self.url}/api/printer", headers=self.headers, timeout=5.0)
                
                if response.status_code == 200:
                    data = response.json()
                    if inspect.isawaitable(data):
                        data = await data
                    # Simplify OctoPrint state
                    state = data.get("state", {}).get("text", "Unknown")
                    temps = {
                        "tool0": data.get("temperature", {}).get("tool0", {}).get("actual", 0),
                        "bed": data.get("temperature", {}).get("bed", {}).get("actual", 0)
                    }
                    return {
                        "success": True,
                        "status": state,
                        "temps": temps
                    }
                elif response.status_code == 409:
                    # Printer not operational
                    return {
                        "success": True,
                        "status": "Not Operational",
                        "temps": {}
                    }
                else:
                    return {
                        "success": False,
                        "error": f"HTTP {response.status_code}: {response.text}"
                    }
            except Exception as e:
                logger.error(f"OctoPrint status error at {self.url}: {str(e)}")
                return {"success": False, "error": str(e)}

    async def submit_job(self, file_path: str, filename: str) -> Dict[str, Any]:
        """
        Uploads and starts a print job.
        """
        async with httpx.AsyncClient() as client:
            try:
                with open(file_path, "rb") as f:
                    files = {"file": (filename, f, "application/octet-stream")}
                    # Upload to 'local' folder and select+print
                    data = {"select": "true", "print": "true"}
                    response = await client.post(
                        f"{self.url}/api/files/local",
                        headers=self.headers,
                        files=files,
                        data=data,
                        timeout=30.0
                    )
                
                if response.status_code in (201, 200):
                    return {"success": True, "data": response.json()}
                else:
                    return {"success": False, "error": response.text}
            except Exception as e:
                logger.error(f"OctoPrint upload error at {self.url}: {str(e)}")
                return {"success": False, "error": str(e)}

    async def cancel_job(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/api/job",
                headers=self.headers,
                json={"command": "cancel"}
            )
            return {"success": response.status_code == 204}

    async def pause_job(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/api/job",
                headers=self.headers,
                json={"command": "pause", "action": "pause"}
            )
            return {"success": response.status_code == 204}

    async def resume_job(self) -> Dict[str, Any]:
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.url}/api/job",
                headers=self.headers,
                json={"command": "pause", "action": "resume"}
            )
            return {"success": response.status_code == 204}
