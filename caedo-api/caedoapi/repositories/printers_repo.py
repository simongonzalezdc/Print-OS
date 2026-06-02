from typing import List, Optional, Dict, Any
import json
from ..db import get_db
from ..utils.crypto import encrypt_value, decrypt_value

class PrinterRepository:
    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM printers ORDER BY name ASC").fetchall()
            results = [dict(row) for row in rows]
            for r in results:
                if r.get('api_key'):
                    r['api_key'] = decrypt_value(r['api_key'])
            return results

    @staticmethod
    def get_by_id(printer_id: int) -> Optional[Dict[str, Any]]:
        with get_db() as conn:
            row = conn.execute("SELECT * FROM printers WHERE id = ?", (printer_id,)).fetchone()
            if not row:
                return None
            res = dict(row)
            if res.get('api_key'):
                res['api_key'] = decrypt_value(res['api_key'])
            return res

    @staticmethod
    def create(data: Dict[str, Any]) -> int:
        required_keys = ['name', 'build_x_mm', 'build_y_mm', 'build_z_mm']
        for key in required_keys:
            if key not in data:
                raise ValueError(f"Missing required field: {key}")

        api_key = encrypt_value(data.get('api_key'))

        with get_db() as conn:
            cursor = conn.execute("""
                INSERT INTO printers (
                    name, build_x_mm, build_y_mm, build_z_mm, 
                    supports_materials_json, multicolor_enabled, 
                    max_colors, speed_tier, reliability_score,
                    api_type, api_url, api_key, ip_address, notes
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                data['name'], data['build_x_mm'], data['build_y_mm'], data['build_z_mm'],
                json.dumps(data.get('supports_materials_json', ["PLA"])),
                1 if data.get('multicolor_enabled') else 0,
                data.get('max_colors'),
                data.get('speed_tier', 'normal'),
                data.get('reliability_score', 0.9),
                data.get('api_type', 'none'),
                data.get('api_url'),
                api_key,
                data.get('ip_address'),
                data.get('notes')
            ))
            conn.commit()
            return cursor.lastrowid

    @staticmethod
    def update(printer_id: int, data: Dict[str, Any]) -> bool:
        required_keys = ['name', 'build_x_mm', 'build_y_mm', 'build_z_mm']
        for key in required_keys:
            if key not in data:
                raise ValueError(f"Missing required field: {key}")

        api_key = encrypt_value(data.get('api_key'))

        with get_db() as conn:
            cursor = conn.execute("""
                UPDATE printers SET
                    name = ?, build_x_mm = ?, build_y_mm = ?, build_z_mm = ?,
                    supports_materials_json = ?, multicolor_enabled = ?,
                    max_colors = ?, speed_tier = ?, reliability_score = ?, 
                    api_type = ?, api_url = ?, api_key = ?, ip_address = ?,
                    notes = ?, updated_at = datetime('now')
                WHERE id = ?
            """, (
                data['name'], data['build_x_mm'], data['build_y_mm'], data['build_z_mm'],
                json.dumps(data.get('supports_materials_json', ["PLA"])),
                1 if data.get('multicolor_enabled') else 0,
                data.get('max_colors'),
                data.get('speed_tier', 'normal'),
                data.get('reliability_score', 0.9),
                data.get('api_type', 'none'),
                data.get('api_url'),
                api_key,
                data.get('ip_address'),
                data.get('notes'),
                printer_id
            ))
            conn.commit()
            return cursor.rowcount > 0

    @staticmethod
    def delete(printer_id: int) -> bool:
        with get_db() as conn:
            cursor = conn.execute("DELETE FROM printers WHERE id = ?", (printer_id,))
            conn.commit()
            return cursor.rowcount > 0
