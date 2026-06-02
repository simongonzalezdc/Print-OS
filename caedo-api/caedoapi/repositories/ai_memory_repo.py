from typing import List, Optional, Dict, Any
from ..db import get_db

class AIMemoryRepository:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM ai_memory ORDER BY importance DESC, created_at DESC").fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def create(data: Dict[str, Any]) -> int:
        # Check for similar content in same category
        with get_db() as conn:
            existing = conn.execute(
                "SELECT id FROM ai_memory WHERE category = ? AND content LIKE ?", 
                (data['category'], f"%{data['content'][:20]}%")
            ).fetchone()
            if existing:
                # Update importance of existing instead of creating new
                conn.execute(
                    "UPDATE ai_memory SET importance = (importance + ?) / 2, updated_at = datetime('now') WHERE id = ?",
                    (data.get('importance', 0.5), existing['id'])
                )
                conn.commit()
                return existing['id']

            cursor = conn.execute("""
                INSERT INTO ai_memory (category, content, importance, source_design_id)
                VALUES (?, ?, ?, ?)
            """, (
                data['category'],
                data['content'],
                data.get('importance', 0.5),
                data.get('source_design_id')
            ))
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def delete(memory_id: int) -> bool:
        with get_db() as conn:
            cursor = conn.execute("DELETE FROM ai_memory WHERE id = ?", (memory_id,))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def update_importance(memory_id: int, importance: float) -> bool:
        with get_db() as conn:
            cursor = conn.execute("UPDATE ai_memory SET importance = ?, updated_at = datetime('now') WHERE id = ?", (importance, memory_id))
            conn.commit()
            return cursor.rowcount > 0
