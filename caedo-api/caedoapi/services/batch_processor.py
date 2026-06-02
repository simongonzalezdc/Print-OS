import json
import logging
from datetime import datetime
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.jobstores.sqlalchemy import SQLAlchemyJobStore
from caedoapi.ai.client import AIClient
from caedoapi.db import DB_PATH, get_db

logger = logging.getLogger(__name__)

class BatchProcessor:
    def __init__(self):
        jobstores = {
            'default': SQLAlchemyJobStore(url=f'sqlite:///{DB_PATH}')
        }
        self.scheduler = BackgroundScheduler(jobstores=jobstores)
        self.ai_client = AIClient()
        self.scheduler.start()

    def add_batch_job(self, prompts: list, context: dict = None):
        """Adds a new batch job to the queue."""
        job_id = f"batch_{int(datetime.now().timestamp())}"
        self.scheduler.add_job(
            self._process_batch, 
            'date', 
            run_date=datetime.now(),
            args=[job_id, prompts, context],
            id=job_id
        )
        return job_id

    def _process_batch(self, job_id: str, prompts: list, context: dict):
        """Internal worker to process prompts one by one."""
        logger.info(f"Starting batch job: {job_id} with {len(prompts)} variations")
        results = []
        
        for i, prompt in enumerate(prompts):
            try:
                # Use evaluate_idea or similar as a proxy for generation for now
                # In a real scenario, this would call the specialized design agent
                result = self.ai_client.evaluate_idea(prompt)
                results.append({
                    "prompt": prompt,
                    "status": "completed",
                    "result": result.dict() if hasattr(result, 'dict') else result
                })
            except Exception as e:
                logger.error(f"Error processing variation {i} in batch {job_id}: {e}")
                results.append({
                    "prompt": prompt,
                    "status": "failed",
                    "error": str(e)
                })

        # Save results to a "batch_results" table or similar
        self._save_results(job_id, results)
        logger.info(f"Completed batch job: {job_id}")

    def _save_results(self, job_id: str, results: list):
        """Saves batch results to the database."""
        with get_db() as conn:
            # Create table if not exists
            conn.execute("""
                CREATE TABLE IF NOT EXISTS batch_jobs (
                    id TEXT PRIMARY KEY,
                    results_json TEXT,
                    completed_at TEXT DEFAULT (datetime('now'))
                )
            """)
            conn.execute(
                "INSERT INTO batch_jobs (id, results_json) VALUES (?, ?)",
                (job_id, json.dumps(results))
            )
            conn.commit()

    def get_batch_status(self, job_id: str):
        """Retrieves results of a batch job."""
        with get_db() as conn:
            row = conn.execute("SELECT results_json FROM batch_jobs WHERE id = ?", (job_id,)).fetchone()
            if row:
                return json.loads(row['results_json'])
            
            # Check if it's still in the scheduler
            job = self.scheduler.get_job(job_id)
            if job:
                return {"status": "processing"}
            
            return {"status": "not_found"}

# Global instance
batch_processor = BatchProcessor()

