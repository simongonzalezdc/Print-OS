from typing import Dict, List, Tuple

ALLOWED_TRANSITIONS = {
    "queued": ["printing", "canceled"],
    "printing": ["completed", "failed", "canceled"],
    "completed": [],
    "failed": [],
    "canceled": [],
}

def can_transition(from_status: str, to_status: str) -> bool:
    return to_status in ALLOWED_TRANSITIONS.get(from_status, [])

def validate_transition(from_status: str, to_status: str, data: Dict = None) -> Tuple[bool, str]:
    if not can_transition(from_status, to_status):
        return False, f"Invalid state transition from {from_status} to {to_status}"
    
    if to_status == "completed":
        if not data or not data.get("grams_actual") or not data.get("minutes_actual"):
            return False, "Completion requires actual grams and minutes."
            
    if to_status == "failed":
        if not data or not data.get("failure_reason"):
            return False, "Failure requires a reason."
            
    return True, ""
