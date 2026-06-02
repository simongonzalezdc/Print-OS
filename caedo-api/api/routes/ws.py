from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from typing import List, Dict, Optional
import json
import logging
import asyncio
from caedoapi.db import get_db

router = APIRouter()
logger = logging.getLogger(__name__)

class ConnectionManager:
    def __init__(self):
        self.active_connections: List[WebSocket] = []
        self.client_map: Dict[str, WebSocket] = {}

    async def connect(self, websocket: WebSocket, client_id: str):
        await websocket.accept()
        self.active_connections.append(websocket)
        self.client_map[client_id] = websocket
        logger.info(f"Client {client_id} connected via WebSocket")

    def disconnect(self, websocket: WebSocket, client_id: str):
        if websocket in self.active_connections:
            self.active_connections.remove(websocket)
        if client_id in self.client_map:
            del self.client_map[client_id]
        logger.info(f"Client {client_id} disconnected from WebSocket")

    async def send_personal_message(self, message: str, client_id: str):
        if client_id in self.client_map:
            await self.client_map[client_id].send_text(message)

    async def broadcast(self, message: str):
        for connection in self.active_connections:
            try:
                await connection.send_text(message)
            except Exception as e:
                logger.error(f"Error broadcasting to a connection: {e}")

manager = ConnectionManager()

async def get_queue_data():
    """Helper to fetch current queue status for broadcasting."""
    with get_db() as conn:
        jobs = conn.execute("""
            SELECT id, name, status, priority, material, grams_estimated, minutes_estimated
            FROM jobs 
            WHERE status IN ('queued', 'printing')
            ORDER BY 
                CASE priority 
                    WHEN 'urgent' THEN 1 
                    WHEN 'normal' THEN 2 
                    WHEN 'low' THEN 3 
                END, 
                created_at ASC
        """).fetchall()
        return [dict(row) for row in jobs]

@router.websocket("/ws/{client_id}")
async def websocket_endpoint(websocket: WebSocket, client_id: str):
    await manager.connect(websocket, client_id)
    
    # Task for periodic queue updates (solo-operator friendly polling)
    async def periodic_queue_update():
        try:
            while True:
                queue = await get_queue_data()
                await websocket.send_text(json.dumps({
                    "type": "QUEUE_SYNC",
                    "data": queue
                }))
                await asyncio.sleep(10) # 10s interval for background sync
        except Exception:
            pass # Task will die on disconnect

    # Start periodic updates as a background task for this connection
    update_task = asyncio.create_task(periodic_queue_update())

    try:
        while True:
            data = await websocket.receive_text()
            message = json.loads(data)
            
            if message.get("type") == "PING":
                await websocket.send_text(json.dumps({"type": "PONG"}))
            elif message.get("type") == "JOB_SUBMITTED" or message.get("type") == "REFRESH_QUEUE":
                queue = await get_queue_data()
                await manager.broadcast(json.dumps({
                    "type": "QUEUE_UPDATE",
                    "data": queue,
                    "reason": message.get("type"),
                    "client_id": client_id
                }))
            
    except WebSocketDisconnect:
        update_task.cancel()
        manager.disconnect(websocket, client_id)
    except Exception as e:
        update_task.cancel()
        logger.error(f"WebSocket error for {client_id}: {str(e)}")
        manager.disconnect(websocket, client_id)
