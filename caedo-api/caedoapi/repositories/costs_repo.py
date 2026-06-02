from typing import Dict, Any, List, Optional
import json
from ..db import get_db

class CostsRepository:
    @staticmethod
    def get_all() -> Dict[str, Any]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM costs").fetchall()
            costs = {}
            for row in rows:
                val = row['value_text']
                if row['value_type'] == 'number':
                    val = float(val)
                elif row['value_type'] == 'json':
                    val = json.loads(val)
                costs[row['key']] = val
            return costs

    @staticmethod
    def get_by_key(key: str) -> Optional[Any]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM costs WHERE key = ?", (key,)).fetchone()
            if not row:
                return None
            val = row['value_text']
            if row['value_type'] == 'number':
                return float(val)
            elif row['value_type'] == 'json':
                return json.loads(val)
            return val

    @staticmethod
    def set(key: str, value: Any, value_type: str) -> bool:
        with get_db() as conn:
            vtext = value
            if value_type == 'json':
                vtext = json.dumps(value)
            elif value_type == 'number':
                vtext = str(value)
            
            conn.execute("""
                INSERT INTO costs (key, value_type, value_text)
                VALUES (?, ?, ?)
                ON CONFLICT(key) DO UPDATE SET
                    value_type = excluded.value_type,
                    value_text = excluded.value_text,
                    updated_at = datetime('now')
            """, (key, value_type, vtext))
            conn.commit()
            return True
