from typing import List, Dict, Any
import json
from ..db import get_db

class EventsRepository:
    @staticmethod
    def log_event(job_id: int, event_type: str, payload: Dict[str, Any] = None) -> int:
        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO events (job_id, event_type, payload_json)
                VALUES (?, ?, ?)
            """, (job_id, event_type, json.dumps(payload or {})))
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def get_by_job(job_id: int) -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("""
                SELECT * FROM events WHERE job_id = ? ORDER BY created_at ASC
            """, (job_id,)).fetchall()
            return [dict(row) for row in rows]
