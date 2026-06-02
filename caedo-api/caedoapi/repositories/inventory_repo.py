from typing import List, Dict, Any, Optional
from ..db import get_db

class InventoryRepository:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM inventory ORDER BY material, color").fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def create(data: Dict[str, Any]) -> int:
        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO inventory (material, color, weight_g, cost_per_kg, status, min_threshold_g)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                data['material'],
                data['color'],
                data['weight_g'],
                data.get('cost_per_kg'),
                data.get('status', 'in_stock'),
                data.get('min_threshold_g', 200.0)
            ))
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def update_weight(material: str, color: str, grams_used: float) -> bool:
        with get_db() as conn:
            # Find the item
            row = conn.execute("SELECT id, weight_g, min_threshold_g FROM inventory WHERE material = ? AND color = ?", (material, color)).fetchone()
            if not row:
                return False
            
            new_weight = max(0, row['weight_g'] - grams_used)
            new_status = 'in_stock'
            if new_weight <= 0:
                new_status = 'out_of_stock'
            elif new_weight <= row['min_threshold_g']:
                new_status = 'low'
                
            conn.execute("""
                UPDATE inventory 
                SET weight_g = ?, status = ?, updated_at = datetime('now') 
                WHERE id = ?
            """, (new_weight, new_status, row['id']))
            conn.commit()
            return True

    @staticmethod
    def delete(item_id: int) -> bool:
        with get_db() as conn:
            cursor = conn.execute("DELETE FROM inventory WHERE id = ?", (item_id,))
            conn.commit()
            return cursor.rowcount > 0
