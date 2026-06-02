from typing import List, Dict, Any, Optional
from decimal import Decimal
from caedoapi.db import get_db

class AIUsageRepository:
    @staticmethod
    def log_usage(
        feature: str, 
        model: str, 
        prompt_tokens: int, 
        completion_tokens: int, 
        total_tokens: int,
        client_id: Optional[str] = None,
        endpoint: Optional[str] = None,
        cost_usd: Optional[float] = None
    ):
        with get_db() as conn:
            conn.execute("""
                INSERT INTO ai_usage (
                    feature, model, prompt_tokens, completion_tokens, total_tokens, 
                    client_id, endpoint, cost_usd
                )
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                feature, model, prompt_tokens, completion_tokens, total_tokens, 
                client_id, endpoint, cost_usd
            ))
            conn.commit()

    @staticmethod
    def get_all() -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("SELECT * FROM ai_usage ORDER BY created_at DESC").fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def get_summary() -> Dict[str, Any]:
        with get_db() as conn:
            row = conn.execute("""
                SELECT 
                    COUNT(*) as total_calls,
                    SUM(prompt_tokens) as total_prompt_tokens,
                    SUM(completion_tokens) as total_completion_tokens,
                    SUM(total_tokens) as total_tokens,
                    SUM(cost_usd) as total_cost_usd
                FROM ai_usage
            """).fetchone()
            return dict(row) if row else {
                "total_calls": 0,
                "total_prompt_tokens": 0,
                "total_completion_tokens": 0,
                "total_tokens": 0,
                "total_cost_usd": 0.0
            }

    @staticmethod
    def get_usage_by_day() -> List[Dict[str, Any]]:
        with get_db() as conn:
            # Using strftime to group by date
            rows = conn.execute("""
                SELECT 
                    strftime('%Y-%m-%d', created_at) as date,
                    SUM(cost_usd) as cost,
                    SUM(total_tokens) as tokens,
                    COUNT(*) as calls
                FROM ai_usage
                GROUP BY date
                ORDER BY date ASC
                LIMIT 30
            """).fetchall()
            return [dict(row) for row in rows]

    @staticmethod
    def get_usage_by_feature() -> List[Dict[str, Any]]:
        with get_db() as conn:
            rows = conn.execute("""
                SELECT 
                    feature,
                    SUM(cost_usd) as cost,
                    SUM(total_tokens) as tokens,
                    COUNT(*) as calls
                FROM ai_usage
                GROUP BY feature
                ORDER BY cost DESC
            """).fetchall()
            return [dict(row) for row in rows]
