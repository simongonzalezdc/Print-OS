import os

AI_CONFIG = {
    "model": "glm-4.7",
    "base_url": "https://api.z.ai/api/coding/paas/v4",
    "api_key_env": "ZHIPUAI_API_KEY",
}

def get_api_key():
    # Try environment variable first
    key = os.environ.get(AI_CONFIG["api_key_env"])
    if key:
        return key
    
    # Try streamlit secrets as fallback (during transition)
    try:
        import streamlit as st
        return st.secrets.get(AI_CONFIG["api_key_env"])
    except:
        pass
    
    return None

