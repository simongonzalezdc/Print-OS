import sys
import os
from contextlib import asynccontextmanager

# Add the parent directory to sys.path to allow importing caedoapi
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn
from api.routes import business, printers, jobs, ai, projects, queue, ws, ai_memory, system, inventory
from caedoapi.db import init_db


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Apply local SQLite migrations before API routes touch the database."""
    init_db()
    yield


app = FastAPI(title="CAEDO API", version="1.0.0", lifespan=lifespan)

# CORS configuration for the Next.js frontend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:3001",
        "http://localhost:3002",
        "http://localhost:4182",
        "http://127.0.0.1:3000",
        "http://127.0.0.1:3001",
        "http://127.0.0.1:3002",
        "http://127.0.0.1:4182",
        "https://caedo.app",  # Production domain
    ],
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allow_headers=["Authorization", "Content-Type", "X-Requested-With"],
)

# Include routes (Versioned)
app.include_router(business.router, prefix="/api/v1/business", tags=["business"])
app.include_router(printers.router, prefix="/api/v1/printers", tags=["printers"])
app.include_router(jobs.router, prefix="/api/v1/jobs", tags=["jobs"])
app.include_router(ai.router, prefix="/api/v1/ai", tags=["ai"])
app.include_router(ai_memory.router, prefix="/api/v1/ai/memory", tags=["ai-memory"])
app.include_router(projects.router, prefix="/api/v1/projects", tags=["projects"])
app.include_router(queue.router, prefix="/api/v1/queue", tags=["queue"])
app.include_router(system.router, prefix="/api/v1/system", tags=["system"])
app.include_router(inventory.router, prefix="/api/v1/inventory", tags=["inventory"])
app.include_router(ws.router, tags=["websocket"])

# Backward-compatible aliases for older local clients and tests.
app.include_router(business.router, prefix="/api/business", tags=["business"])
app.include_router(printers.router, prefix="/api/printers", tags=["printers"])
app.include_router(jobs.router, prefix="/api/jobs", tags=["jobs"])
app.include_router(ai.router, prefix="/api/ai", tags=["ai"])
app.include_router(ai_memory.router, prefix="/api/ai/memory", tags=["ai-memory"])
app.include_router(projects.router, prefix="/api/projects", tags=["projects"])
app.include_router(queue.router, prefix="/api/queue", tags=["queue"])
app.include_router(system.router, prefix="/api/system", tags=["system"])
app.include_router(inventory.router, prefix="/api/inventory", tags=["inventory"])

@app.get("/")
async def root():
    return {"message": "CAEDO API is online", "version": "1.0.0"}

@app.get("/health")
async def health():
    return {"status": "healthy"}

if __name__ == "__main__":
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)
