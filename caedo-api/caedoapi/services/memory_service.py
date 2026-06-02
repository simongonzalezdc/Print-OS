import json
import logging
from typing import List, Dict, Any
from ..ai.client import AIClient
from ..repositories.ai_memory_repo import AIMemoryRepository
from ..ai import prompts

logger = logging.getLogger(__name__)

class MemoryService:
    def __init__(self, ai_client: AIClient):
        self.ai_client = ai_client

    async def extract_and_save_memories(self, conversation: List[Dict[str, str]], source_design_id: int = None):
        """
        Analyzes a conversation to extract user preferences and saves them to the repository.
        """
        if not self.ai_client.is_available():
            return

        try:
            # Prepare conversation for AI analysis
            conv_str = "\n".join([f"{m['role'].upper()}: {m['content']}" for m in conversation])
            
            system_prompt = """
            You are a Preference Extraction AI. Analyze the following conversation and extract key user preferences, design styles, or material choices.
            Return a JSON object with a list of 'memories'.
            Each memory should have:
            - 'category': one of [design, material, business, technical]
            - 'content': a concise description of the preference
            - 'importance': a float between 0 and 1
            
            Focus on things the user EXPLICITLY likes or dislikes, or repeated choices.
            """
            
            from ..ai.config import DEFAULT_AI_MODEL
            response = self.ai_client.client.chat.completions.create(
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": f"Conversation:\n{conv_str}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.3
            )
            
            data = json.loads(response.choices[0].message.content)
            memories = data.get('memories', [])
            
            for m in memories:
                # Check for duplicates or similar existing memories before saving
                # (Simplified for now: just save new ones)
                AIMemoryRepository.create({
                    'category': m['category'],
                    'content': m['content'],
                    'importance': m['importance'],
                    'source_design_id': source_design_id
                })
                
            return len(memories)
        except Exception as e:
            logger.error(f"Failed to extract memories: {e}")
            return 0
