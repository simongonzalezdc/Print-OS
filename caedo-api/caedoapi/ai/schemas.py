from pydantic import BaseModel, Field
from typing import List, Optional

class IdeaEvaluation(BaseModel):
    category: str = Field(description="Product category (e.g., Home Decor, Tools, Toys)")
    difficulty: int = Field(description="Print difficulty rating from 1 to 5", ge=1, le=5)
    price_range_low: float = Field(description="Suggested low-end price in USD")
    price_range_high: float = Field(description="Suggested high-end price in USD")
    risks: List[str] = Field(description="List of potential risks (competition, IP, returns)")
    suggested_materials: List[str] = Field(description="List of materials best suited for this part")
    grams_estimate_low: float = Field(description="Low estimate of print weight in grams")
    grams_estimate_high: float = Field(description="High estimate of print weight in grams")
    minutes_estimate_low: float = Field(description="Low estimate of print time in minutes")
    minutes_estimate_high: float = Field(description="High estimate of print time in minutes")
    reasoning: str = Field(description="Short human explanation of the analysis")

class FailurePrediction(BaseModel):
    risk_score: int = Field(description="Risk score from 0 to 100", ge=0, le=100)
    risk_level: str = Field(description="Low, Medium, or High risk")
    top_factors: List[str] = Field(description="Top 3 factors contributing to the risk")
    mitigation_steps: List[str] = Field(description="Recommended steps to reduce failure risk")
    explanation: str = Field(description="Detailed reasoning for the risk assessment")

class MarketplaceListing(BaseModel):
    title: str = Field(description="SEO-optimized product title")
    description: str = Field(description="Compelling product description with features and benefits")
    tags: List[str] = Field(description="13 optimized tags/keywords for the platform")
    pricing_strategy: str = Field(description="Recommended pricing strategy and justification")

class DesignAgentPrompt(BaseModel):
    design_prompt_title: str = Field(description="A concise title for the design task")
    design_prompt_body: str = Field(description="A multi-paragraph, copy-paste-ready prompt for the design agent")
    key_constraints: List[str] = Field(description="Critical constraints (dimensions, material, etc.)")
    suggested_cad_approach: str = Field(description="Recommended CAD methodology or tools")
