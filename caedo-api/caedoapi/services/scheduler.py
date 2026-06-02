from typing import List, Dict, Any
from caedoapi.repositories.jobs_repo import JobsRepository
from caedoapi.repositories.printers_repo import PrintersRepository
from caedoapi.domain.routing import RoutingEngine

class SchedulingService:
    @staticmethod
    def auto_assign_all():
        """
        Attempts to find optimal assignments for all queued jobs.
        Uses a greedy approach for now: assigns highest priority jobs first to their best-scored printer.
        """
        all_jobs = JobsRepository.get_all()
        queued_jobs = [j for j in all_jobs if j['status'] == 'queued']
        printers = PrintersRepository.get_all()
        
        # Sort jobs by priority (urgent first) and then by creation date
        priority_map = {"urgent": 0, "normal": 1, "low": 2}
        queued_jobs.sort(key=lambda j: (priority_map.get(j['priority'], 1), j['created_at']))
        
        assignments = []
        
        for job in queued_jobs:
            # Refresh active job counts for printers (not implemented in repo yet, but we'll simulate)
            # In a real app, we'd update p['active_jobs_count'] based on current assignments
            for p in printers:
                p['active_jobs_count'] = len([j for j in all_jobs if j.get('assigned_printer_id') == p['id'] and j['status'] == 'printing'])
            
            rec = RoutingEngine.get_recommendation(job, printers)
            if rec['success']:
                printer_id = rec['recommended_printer_id']
                # Persist the assignment in the repository
                JobsRepository.assign_printer(job['id'], printer_id)
                assignments.append({
                    "job_id": job['id'],
                    "job_name": job['name'],
                    "printer_id": printer_id,
                    "printer_name": rec['recommended_printer_name'],
                    "reason": rec['explanation']
                })
                
        return assignments

# Global instance
scheduling_service = SchedulingService()

