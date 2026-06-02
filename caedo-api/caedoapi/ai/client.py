from typing import Any
import time
import json
import os
from openai import OpenAI
from .schemas import IdeaEvaluation, FailurePrediction, MarketplaceListing, DesignAgentPrompt
from . import prompts
from .config import DEFAULT_AI_MODEL
from caedoapi.repositories.ai_usage_repo import AIUsageRepository
from caedoapi.repositories.ai_memory_repo import AIMemoryRepository

# Try to import streamlit for secrets, but don't fail if it's not available or causes issues
try:
    import streamlit as st
    HAS_STREAMLIT = True
except (ImportError, PermissionError):
    HAS_STREAMLIT = False

"""
Centralized AI Client for Caedo API.
V2 Optimization for GLM-4.7.
"""

from caedoapi.utils.logger import logger

class AIClient:
    def __init__(self):
        # Default to ZhipuAI Coding Plan endpoint
        self.api_key = None
        self.base_url = "https://api.z.ai/api/coding/paas/v4"
        
        # 1. Try environment variables first (standard for FastAPI)
        self.api_key = os.environ.get("ZHIPUAI_API_KEY") or os.environ.get("ZAI_API_KEY")
        self.base_url = os.environ.get("ZHIPUAI_BASE_URL") or os.environ.get("ZAI_BASE_URL") or self.base_url
        
        # 2. Try Streamlit secrets as fallback if available
        if not self.api_key and HAS_STREAMLIT:
            try:
                self.api_key = st.secrets.get("ZHIPUAI_API_KEY") or st.secrets.get("ZAI_API_KEY")
                self.base_url = st.secrets.get("ZHIPUAI_BASE_URL") or st.secrets.get("ZAI_BASE_URL") or self.base_url
            except Exception:
                pass
        
        # 3. Last ditch: try loading from .streamlit/secrets.toml manually if it exists
        if not self.api_key:
            try:
                import toml
                secrets_path = os.path.join(os.getcwd(), ".streamlit", "secrets.toml")
                if os.path.exists(secrets_path):
                    with open(secrets_path, "r") as f:
                        secrets = toml.load(f)
                        self.api_key = secrets.get("ZHIPUAI_API_KEY") or secrets.get("ZAI_API_KEY")
                        self.base_url = secrets.get("ZHIPUAI_BASE_URL") or secrets.get("ZAI_BASE_URL") or self.base_url
            except Exception:
                pass
        
        if self.api_key:
            # Use OpenAI client as a wrapper for ZhipuAI's compatible endpoint
            self.client = OpenAI(
                api_key=self.api_key,
                base_url=self.base_url
            )
        else:
            logger.warning("No API key found. Stub mode enabled.")
            self.client = None

    def _log_error(self, message: str):
        """Standardized error logging."""
        if HAS_STREAMLIT:
            try:
                st.error(message)
            except Exception:
                logger.error(f"AI error: {message}")
        else:
            print(f"AI_ERROR: {message}")

    def _call_with_retry(self, method, *args, max_retries=3, **kwargs):
        """Internal helper for robust API calls with exponential backoff."""
        if not self.client:
            raise Exception("AI_CLIENT_OFFLINE")
            
        for attempt in range(max_retries):
            try:
                return method(*args, **kwargs)
            except Exception as e:
                if attempt == max_retries - 1:
                    raise e
                wait_time = (2 ** attempt) + 0.1
                time.sleep(wait_time)
        return None

    def is_available(self) -> bool:
        return self.client is not None

    def _format_error(self, code: str, message: str, required_fields: list = None) -> dict:
        """Standardized error format for AI features."""
        return {
            "success": False,
            "error_code": code,
            "error_message": message,
            "required_fields": required_fields or [],
            "fallback_used": True,
            "fallback_value": None
        }

    def _log_usage(self, feature: str, response: Any):
        """Helper to log token usage from an OpenAI-compatible response."""
        try:
            usage = response.usage
            AIUsageRepository.log_usage(
                feature=feature,
                model=response.model,
                prompt_tokens=usage.prompt_tokens,
                completion_tokens=usage.completion_tokens,
                total_tokens=usage.total_tokens,
                endpoint="caedo-api/ai"
            )
        except Exception:
            pass

    def log_manual_usage(self, feature: str, model: str, prompt_tokens: int, completion_tokens: int, client_id: str = None, endpoint: str = None, cost_usd: float = None):
        """Manually log usage from external calls (like the Next.js frontend)."""
        AIUsageRepository.log_usage(
            feature=feature,
            model=model,
            prompt_tokens=prompt_tokens,
            completion_tokens=completion_tokens,
            total_tokens=prompt_tokens + completion_tokens,
            client_id=client_id,
            endpoint=endpoint,
            cost_usd=cost_usd
        )

    def evaluate_idea(self, idea: str, platform: str = "Etsy") -> IdeaEvaluation:
        if not self.is_available():
            return self._get_stub_data(idea)
        
        try:
            # Inject AI Memory (Personal Preferences)
            memories = AIMemoryRepository.get_all()
            memory_ctx = ""
            if memories:
                memory_ctx = "\n\nUSER_PREFERENCES:\n" + "\n".join([f"- {m['content']}" for m in memories[:10]])

            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": prompts.EVALUATION_SYSTEM_PROMPT + memory_ctx},
                    {"role": "user", "content": f"Idea: {idea}\nPlatform: {platform}"}
                ],
                response_format={"type": "json_object"},
                temperature=prompts.TEMPERATURE_MAP["evaluation"],
                max_tokens=prompts.MAX_TOKENS_MAP["evaluation"],
                top_p=0.95
            )
            
            self._log_usage("evaluation", response)
            raw_json = response.choices[0].message.content
            data = json.loads(raw_json)
            return IdeaEvaluation(**data)
        except Exception as e:
            self._log_error(f"AI_ERROR: {e}")
            return self._format_error("API_ERROR", str(e))

    def predict_failure(self, job_data: dict, printer_history: list = None) -> FailurePrediction:
        if not self.is_available():
            return self._get_failure_stub()
        
        try:
            history_context = json.dumps(printer_history) if printer_history else "No recent history."
            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": prompts.FAILURE_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Job: {json.dumps(job_data)}\nHistory: {history_context}"}
                ],
                response_format={"type": "json_object"},
                temperature=prompts.TEMPERATURE_MAP["failure"],
                max_tokens=prompts.MAX_TOKENS_MAP["failure"],
                top_p=0.9
            )
            
            self._log_usage("failure", response)
            raw_json = response.choices[0].message.content
            data = json.loads(raw_json)
            return FailurePrediction(**data)
        except Exception as e:
            self._log_error(f"AI_PREDICT_ERROR: {e}")
            return self._format_error("PREDICT_ERROR", str(e))

    def analyze_failure_photo(self, photo_data_url: str, job_context: dict = None) -> dict:
        """
        Analyzes a photo of a failed print to identify root causes.
        Uses vision-capable models (GLM-4V).
        """
        if not self.is_available():
            return {"error": "AI_OFFLINE", "analysis": "Vision analysis requires AI link."}
            
        try:
            # Prepare message with image
            messages = [
                {"role": "system", "content": "You are a 3D Printing Failure Diagnostics AI. Analyze the photo of the failed print and identify the root cause (e.g., bed adhesion, underextrusion, layer shift). Return a JSON object with: 'root_cause', 'confidence', 'mitigation_steps', 'explanation'."},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": f"Analyze this failed print. Context: {json.dumps(job_context) if job_context else 'None'}"},
                        {"type": "image_url", "image_url": {"url": photo_data_url}}
                    ]
                }
            ]
            
            response = self.client.chat.completions.create(
                model="glm-4v", # Specifically use the vision model
                messages=messages,
                response_format={"type": "json_object"},
                max_tokens=1024
            )
            
            self._log_usage("failure_vision", response)
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            self._log_error(f"AI_VISION_ERROR: {e}")
            return {"error": str(e), "analysis": "Failed to process image."}

    def stream_chat(self, messages: list, context: dict = None) -> iter:
        if not self.is_available():
            yield "ASSISTANT_OFFLINE: Connect Z.ai API key to enable."
            return
        
        # Inject AI Memory (Personal Preferences)
        try:
            memories = AIMemoryRepository.get_all()
            if memories:
                memory_str = "\n\nUSER_DESIGN_PREFERENCES_MEMORY:\n"
                for m in memories:
                    memory_str += f"- [{m['category'].upper()}] {m['content']} (Importance: {m['importance']})\n"
                
                # Prepend to system message
                found_system = False
                for m in messages:
                    if m['role'] == 'system':
                        m['content'] += memory_str
                        found_system = True
                        break
                if not found_system:
                    messages.insert(0, {"role": "system", "content": prompts.ASSISTANT_SYSTEM_PROMPT + memory_str})
        except Exception as e:
            logger.error(f"Memory injection error: {e}")

        # Ensure system message exists and inject context
        if context:
            ctx_str = f"\n\nCURRENT_FARM_STATE:\n{json.dumps(context, indent=2)}"
            found_system = False
            for m in messages:
                if m['role'] == 'system':
                    m['content'] = prompts.ASSISTANT_SYSTEM_PROMPT + ctx_str
                    found_system = True
                    break
            
            if not found_system:
                messages.insert(0, {"role": "system", "content": prompts.ASSISTANT_SYSTEM_PROMPT + ctx_str})
        else:
            # Ensure at least the base system prompt is there
            if not any(m['role'] == 'system' for m in messages):
                messages.insert(0, {"role": "system", "content": prompts.ASSISTANT_SYSTEM_PROMPT})

        try:
            response = self.client.chat.completions.create(
                model=DEFAULT_AI_MODEL,
                messages=messages,
                stream=True,
                temperature=prompts.TEMPERATURE_MAP["chat"],
                max_tokens=prompts.MAX_TOKENS_MAP["chat"],
                top_p=0.9
            )
            full_content = ""
            for chunk in response:
                if chunk.choices[0].delta.content:
                    content = chunk.choices[0].delta.content
                    full_content += content
                    yield content
            
            # Since streaming, usage logging is tricky without a dedicated callback
            # For now, we manually log a flat estimate or skip for streaming
        except Exception as e:
            yield f"\n\nAI_STREAM_ERROR: {e}"

    def generate_daily_summary(self, telemetry_data: dict) -> str:
        if not self.is_available():
            return "ASSISTANT_OFFLINE: Telemetry analysis requires active intelligence link."
        
        try:
            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": prompts.SUMMARY_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Telemetry Data: {json.dumps(telemetry_data, indent=2)}"}
                ],
                temperature=prompts.TEMPERATURE_MAP["summary"],
                max_tokens=prompts.MAX_TOKENS_MAP["summary"]
            )
            self._log_usage("summary", response)
            return response.choices[0].message.content
        except Exception as e:
            self._log_error(f"AI_REPORT_ERROR: {e}")
            return self._format_error("REPORT_ERROR", str(e))

    def generate_listing(self, idea: str, platform: str, eval_data: IdeaEvaluation) -> MarketplaceListing:
        if not self.is_available():
            # Return a stub listing
            return MarketplaceListing(
                title=f"Custom {idea[:30]} for {platform}",
                description="AI generation offline. This is a placeholder description for your 3D printed product.",
                tags=["3dprinted", "custom", platform.lower()],
                pricing_strategy="Competitive pricing based on local market averages."
            )
        
        try:
            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": prompts.LISTING_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Product Idea: {idea}\nPlatform: {platform}\nEvaluation: {eval_data.json()}"}
                ],
                response_format={"type": "json_object"},
                temperature=prompts.TEMPERATURE_MAP["listing"],
                max_tokens=prompts.MAX_TOKENS_MAP["listing"],
                top_p=0.9
            )
            self._log_usage("listing", response)
            data = json.loads(response.choices[0].message.content)
            return MarketplaceListing(**data)
        except Exception as e:
            self._log_error(f"AI_LISTING_ERROR: {e}")
            return self._format_error("LISTING_ERROR", str(e))

    def optimize_queue(self, queued_jobs: list, printers: list) -> dict:
        if not self.is_available():
            return {"error": "AI_OFFLINE", "recommendation": "Manual scheduling required."}
        
        try:
            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": prompts.OPTIMIZE_SYSTEM_PROMPT},
                    {"role": "user", "content": f"Queued Jobs: {json.dumps(queued_jobs)}\nPrinters: {json.dumps(printers)}"}
                ],
                response_format={"type": "json_object"},
                temperature=prompts.TEMPERATURE_MAP["optimize"],
                max_tokens=prompts.MAX_TOKENS_MAP["optimize"]
            )
            self._log_usage("optimize", response)
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            self._log_error(f"AI_OPTIMIZE_ERROR: {e}")
            return {"error": str(e), "recommendation": "Optimization failed."}

    def stream_product_chat(self, messages: list, idea: str, platform: str, eval_data: IdeaEvaluation) -> iter:
        """Stream a multi-turn conversation about a product idea with context injection."""
        if not self.is_available():
            yield "CONSULTANT_OFFLINE: Connect AI to enable discussion."
            return

        ctx_str = f"\n\nPRODUCT_CONTEXT:\n- Idea: {idea}\n- Platform: {platform}\n- Evaluation: {eval_data.json()}"
        
        # Ensure system prompt is present and updated
        found_system = False
        for m in messages:
            if m['role'] == 'system':
                m['content'] = prompts.PRODUCT_CONSULTANT_SYSTEM_PROMPT + ctx_str
                found_system = True
                break
        
        if not found_system:
            messages.insert(0, {"role": "system", "content": prompts.PRODUCT_CONSULTANT_SYSTEM_PROMPT + ctx_str})

        try:
            response = self.client.chat.completions.create(
                model=DEFAULT_AI_MODEL,
                messages=messages,
                stream=True,
                temperature=prompts.TEMPERATURE_MAP["product_consultant"],
                max_tokens=prompts.MAX_TOKENS_MAP["product_consultant"],
                top_p=0.9
            )
            for chunk in response:
                if chunk.choices[0].delta.content:
                    yield chunk.choices[0].delta.content
        except Exception as e:
            yield f"\n\nAI_CONSULTANT_ERROR: {e}"

    def generate_design_prompt(self, idea: str, eval_data: IdeaEvaluation, conversation_summary: str = "") -> DesignAgentPrompt:
        """Generate a complete handoff prompt for an external 3D design agent."""
        if not self.is_available():
            return DesignAgentPrompt(
                design_prompt_title="AI_OFFLINE",
                design_prompt_body="Handoff generation failed due to lack of AI connectivity.",
                key_constraints=["Offline"],
                suggested_cad_approach="Manual"
            )
        
        try:
            memories = AIMemoryRepository.get_all()
            memory_ctx = ""
            if memories:
                memory_ctx = "\n\nUSER_PREFERENCES:\n" + "\n".join([f"- {m['content']}" for m in memories[:10]])

            user_msg = f"Product: {idea}\nEvaluation: {eval_data.json()}{memory_ctx}"
            if conversation_summary:
                user_msg += f"\nConversation Context: {conversation_summary}"

            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": prompts.DESIGN_PROMPT_GENERATOR_SYSTEM_PROMPT},
                    {"role": "user", "content": user_msg}
                ],
                response_format={"type": "json_object"},
                temperature=prompts.TEMPERATURE_MAP.get("design_prompt", 0.7),
                max_tokens=prompts.MAX_TOKENS_MAP.get("design_prompt", 2048),
                top_p=0.9
            )
            
            self._log_usage("design_prompt", response)
            data = json.loads(response.choices[0].message.content)
            return DesignAgentPrompt(**data)
        except Exception as e:
            self._log_error(f"DESIGN_PROMPT_ERROR: {e}")
            return DesignAgentPrompt(
                design_prompt_title="GENERATION_FAILED",
                design_prompt_body=f"Error generating design prompt: {str(e)}",
                key_constraints=[],
                suggested_cad_approach="N/A"
            )

    def optimize_design(self, mesh_stats: dict, constraints: dict) -> dict:
        """Suggest design modifications to reduce cost/time."""
        if not self.is_available():
            return {"error": "AI_OFFLINE", "suggestions": "Optimization requires AI link."}
            
        try:
            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Manufacturing Optimization AI. Analyze 3D mesh statistics and constraints to suggest material and time-saving design changes for FDM 3D printing."},
                    {"role": "user", "content": f"Mesh Stats: {json.dumps(mesh_stats)}\nConstraints: {json.dumps(constraints)}"}
                ],
                response_format={"type": "json_object"},
                temperature=0.4,
                max_tokens=1024
            )
            
            self._log_usage("optimization", response)
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e), "suggestions": "Failed to generate optimization strategy."}

    def predict_market(self, idea: str, category: str, complexity: int) -> dict:
        """Estimate sales velocity and optimal pricing."""
        if not self.is_available():
            return {"error": "AI_OFFLINE", "prediction": "Market prediction requires AI link."}
            
        try:
            response = self._call_with_retry(
                self.client.chat.completions.create,
                model=DEFAULT_AI_MODEL,
                messages=[
                    {"role": "system", "content": "You are a Market Intelligence AI. Predict sales velocity, pricing ranges, and break-even points for new 3D printed products based on category and complexity."},
                    {"role": "user", "content": f"Product Idea: {idea}\nCategory: {category}\nComplexity: {complexity}/5"}
                ],
                response_format={"type": "json_object"},
                temperature=0.5,
                max_tokens=1024
            )
            
            self._log_usage("market_prediction", response)
            return json.loads(response.choices[0].message.content)
        except Exception as e:
            return {"error": str(e), "prediction": "Failed to generate market forecast."}

    def _get_failure_stub(self, is_error: bool = False) -> FailurePrediction:
        return FailurePrediction(
            risk_score=15 if not is_error else 50,
            risk_level="Low" if not is_error else "Medium",
            top_factors=["Standard geometry", "Material stability"] if not is_error else ["Telemetry failure", "Default fallback"],
            mitigation_steps=["Check bed level", "Ensure dry filament"] if not is_error else ["Restart system", "Manual inspection"],
            explanation="AI prediction unavailable. Using default safety heuristics."
        )

    def _get_stub_data(self, idea: str, is_error: bool = False) -> IdeaEvaluation:
        """Returns dummy data for development without an API key."""
        return IdeaEvaluation(
            category="General Utility",
            difficulty=3,
            price_range_low=10.0,
            price_range_high=25.0,
            risks=["High competition", "Unknown demand"] if not is_error else ["API Error Fallback"],
            suggested_materials=["PLA"],
            grams_estimate_low=30.0,
            grams_estimate_high=100.0,
            minutes_estimate_low=60.0,
            minutes_estimate_high=180.0,
            reasoning="This is stub data because no OpenAI API key was found in secrets or environment vars."
        )
