from abc import ABC, abstractmethod
from typing import Dict, Any, Optional

class PrinterIntegration(ABC):
    def __init__(self, url: str, api_key: Optional[str] = None):
        self.url = url.rstrip('/')
        self.api_key = api_key

    @abstractmethod
    async def get_status(self) -> Dict[str, Any]:
        """Returns the current status of the printer."""
        pass

    @abstractmethod
    async def submit_job(self, file_path: str, filename: str) -> Dict[str, Any]:
        """Submits a job to the printer."""
        pass

    @abstractmethod
    async def cancel_job(self) -> Dict[str, Any]:
        """Cancels the current job."""
        pass

    @abstractmethod
    async def pause_job(self) -> Dict[str, Any]:
        """Pauses the current job."""
        pass

    @abstractmethod
    async def resume_job(self) -> Dict[str, Any]:
        """Resumes the current job."""
        pass
