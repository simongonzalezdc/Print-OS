from typing import List, Optional, Dict, Any
import json
from ..db import get_db

from caedoapi.utils.logger import logger

class JobsRepository:
    @staticmethod
    def get_all(filters: Dict[str, Any] = None) -> List[Dict[str, Any]]:
        query = "SELECT j.*, p1.name as recommended_printer_name, p2.name as assigned_printer_name FROM jobs j"
        query += " LEFT JOIN printers p1 ON j.recommended_printer_id = p1.id"
        query += " LEFT JOIN printers p2 ON j.assigned_printer_id = p2.id"
        params = []
        
        if filters:
            where_clauses = []
            if 'status' in filters:
                where_clauses.append("j.status = ?")
                params.append(filters['status'])
            if 'not_status' in filters:
                where_clauses.append("j.status != ?")
                params.append(filters['not_status'])
            if where_clauses:
                query += " WHERE " + " AND ".join(where_clauses)
        
        query += " ORDER BY j.created_at DESC"
        
        with get_db() as conn:
            rows = conn.execute(query, params).fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def get_by_id(job_id: int) -> Optional[Dict[str, Any]]:
        query = "SELECT j.*, p1.name as recommended_printer_name, p2.name as assigned_printer_name FROM jobs j"
        query += " LEFT JOIN printers p1 ON j.recommended_printer_id = p1.id"
        query += " LEFT JOIN printers p2 ON j.assigned_printer_id = p2.id"
        query += " WHERE j.id = ?"
        
        with get_db() as conn:
            row = conn.execute(query, (job_id,)).fetchone()
            return dict(row) if row else None

    @staticmethod
    def create(data: Dict[str, Any]) -> int:
        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO jobs (
                    name, source, width_mm, depth_mm, height_mm, material,
                    color_count, grams_estimated, minutes_estimated, priority, due_at,
                    recommended_printer_id, recommended_reason_json, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data['name'], data.get('source', 'personal'), 
                data['width_mm'], data['depth_mm'], data['height_mm'], 
                data['material'], data.get('color_count', 1),
                data.get('grams_estimated'), data.get('minutes_estimated'),
                data.get('priority', 'normal'), data.get('due_at'),
                data['recommended_printer_id'],
                json.dumps(data['recommended_reason_json']),
                data.get('status', 'queued')
            ))
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def update(job_id: int, data: Dict[str, Any]) -> bool:
        ALLOWED_KEYS = {
            'name', 'source', 'width_mm', 'depth_mm', 'height_mm', 'material',
            'color_count', 'grams_estimated', 'minutes_estimated', 'priority', 
            'due_at', 'recommended_printer_id', 'recommended_reason_json', 
            'status', 'assigned_printer_id', 'started_at', 'finished_at'
        }
        
        keys = []
        values = []
        for k, v in data.items():
            if k not in ALLOWED_KEYS:
                continue
            keys.append(f"{k} = ?")
            if isinstance(v, (dict, list)):
                values.append(json.dumps(v))
            else:
                values.append(v)
        
        if not keys:
            return False
            
        values.append(job_id)
        # Use comma as separator for SET clause
        query = f"UPDATE jobs SET {', '.join(keys)}, updated_at = datetime('now') WHERE id = ?"
        
        with get_db() as conn:
            cursor = conn.execute(query, values)
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def assign_printer(job_id: int, printer_id: int) -> bool:
        return JobsRepository.update(job_id, {'assigned_printer_id': printer_id})

    @staticmethod
    def update_status(job_id: int, status: str, extra_data: Dict[str, Any] = None) -> bool:
        data = {'status': status}
        if extra_data:
            data.update(extra_data)
        
        # Consistent ISO format for timestamps
        from datetime import datetime
        now = datetime.now().isoformat()
        
        if status == 'printing':
            data['started_at'] = now
        elif status in ['completed', 'failed', 'canceled']:
            data['finished_at'] = now
            
        # Deduct inventory if completed and not already completed
        if status == 'completed':
            try:
                job = JobsRepository.get_by_id(job_id)
                if job and job.get('status') != 'completed' and (job.get('grams_actual') or job.get('grams_estimated')):
                    grams = job.get('grams_actual') or job.get('grams_estimated') or 0
                    from .inventory_repo import InventoryRepository
                    # Extract material and color from job (simplified for now)
                    # Real app would have structured material/color fields
                    InventoryRepository.update_weight(job['material'], 'Default', grams)
            except Exception as e:
                logger.warning(f"Failed to deduct inventory: {e}")

        return JobsRepository.update(job_id, data)
