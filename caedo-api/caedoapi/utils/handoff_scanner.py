import os
import json
from datetime import datetime

SHARED_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(os.path.dirname(__file__)))), "shared", "handoffs")

def get_recent_handoffs():
    if not os.path.exists(SHARED_DIR):
        return []
    
    handoffs = []
    for file in os.listdir(SHARED_DIR):
        if file.endswith('.json'):
            json_path = os.path.join(SHARED_DIR, file)
            stl_path = json_path.replace('.json', '')
            
            if os.path.exists(stl_path):
                try:
                    with open(json_path, 'r') as f:
                        meta = json.load(f)
                        handoffs.append({
                            "filename": os.path.basename(stl_path),
                            "stl_path": stl_path,
                            "metadata": meta,
                            "timestamp": os.path.getmtime(stl_path)
                        })
                except Exception:
                    pass
                    
    return sorted(handoffs, key=lambda x: x['timestamp'], reverse=True)
