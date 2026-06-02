# Technical Specification Document
## Caedo API — Architecture & Implementation Guide

**Version:** 1.0  
**Date:** December 25, 2025

---

## 1. Technology Stack

| Layer | Technology | Version | Purpose |
|-------|------------|---------|---------|
| Runtime | Python | 3.11+ | Core language |
| UI Framework | Streamlit | Latest | Web dashboard |
| Database | SQLite | Built-in | Persistence |
| Data Processing | Pandas | Latest | Data manipulation |
| Visualization | Plotly | Latest | Interactive charts |
| Validation | Pydantic | Latest | Schema validation |
| AI | OpenAI API | Latest | Structured outputs |
| Config | python-dotenv | Latest | Environment loading |

### Development Tools (Recommended)
- **Linting:** ruff
- **Formatting:** black or ruff format
- **Type Checking:** mypy (optional)
- **Testing:** pytest

---

## 2. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                      UI LAYER (Streamlit)                       │
│  ┌──────────┬──────────┬──────────┬──────────┬──────────┐      │
│  │   Home   │ Facility │ Business │ Settings │ Reports  │      │
│  └──────────┴──────────┴──────────┴──────────┴──────────┘      │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                    DOMAIN LAYER (Pure Python)                   │
│  ┌────────────┬────────────┬────────────┬────────────┐         │
│  │  Routing   │  Costing   │   States   │ Validation │         │
│  │  Engine    │  Engine    │  Machine   │   Logic    │         │
│  └────────────┴────────────┴────────────┴────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     DATA LAYER (SQLite)                         │
│  ┌────────────┬────────────┬────────────┬────────────┐         │
│  │  Printers  │    Jobs    │   Costs    │   Events   │         │
│  │    Repo    │    Repo    │    Repo    │    Repo    │         │
│  └────────────┴────────────┴────────────┴────────────┘         │
│                        │ farm.db │                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      AI LAYER (OpenAI)                          │
│  ┌────────────────────────────────────────────────────┐        │
│  │  Client Wrapper (with stub fallback)               │        │
│  │  Schema Definitions (Pydantic)                     │        │
│  └────────────────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

---

## 3. Project Structure

```
caedoapi/
├── app.py                          # Entrypoint + navigation
├── pages/
│   ├── 1_Home.py                   # Dashboard KPIs
│   ├── 2_Facility.py               # Jobs + queue management
│   ├── 3_Business.py               # AI idea evaluation
│   ├── 4_Settings.py               # Printers + costs
│   └── 5_Reports.py                # Analytics charts
├── caedoapi/
│   ├── __init__.py
│   ├── db.py                       # SQLite connection + init
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── jobs_repo.py            # Job CRUD
│   │   ├── printers_repo.py        # Printer CRUD
│   │   ├── costs_repo.py           # Cost constants CRUD
│   │   └── events_repo.py          # Audit log CRUD
│   ├── domain/
│   │   ├── __init__.py
│   │   ├── routing.py              # Constraint + scoring engine
│   │   ├── costing.py              # Cost/profit calculations
│   │   ├── states.py               # Job state machine
│   │   └── validation.py           # Input validation
│   └── ai/
│       ├── __init__.py
│       ├── client.py               # Z.ai wrapper + stub
│       └── schemas.py              # Pydantic schemas for AI
├── .streamlit/
│   ├── config.toml                 # Theme configuration
│   └── secrets.toml                # API keys (gitignored)
├── requirements.txt
├── README.md
├── AGENTS.md                       # Project rules for AI agents
├── .gitignore
└── farm.db                         # Runtime database (gitignored)
```

---

## 4. Configuration Files

### 4.1 .streamlit/config.toml (Theme)
```toml
[theme]
primaryColor = "#00E5FF"
backgroundColor = "#0E1117"
secondaryBackgroundColor = "#262730"
textColor = "#FAFAFA"
font = "sans serif"
```

### 4.2 .streamlit/secrets.toml (Secrets)
```toml
ZAI_API_KEY = "your_key_here"
ZAI_BASE_URL = "https://api.z.ai/api/coding/paas/v4"
```

### 4.3 requirements.txt
```
streamlit>=1.28.0
pandas>=2.0.0
plotly>=5.18.0
pydantic>=2.5.0
openai>=1.5.0
python-dotenv>=1.0.0
```

### 4.4 .gitignore
```
.venv/
__pycache__/
.pytest_cache/
farm.db
.streamlit/secrets.toml
*.pyc
.ruff_cache/
.mypy_cache/
```

---

## 5. Key Implementation Details

### 5.1 Database Initialization
- Database file: `farm.db` in project root
- Created automatically on first run
- Uses "migrations-lite" approach:
  - On startup, ensure all tables exist
  - Add missing columns safely when needed
  - Never drop data in MVP

### 5.2 Secrets Handling
```python
# Priority order:
# 1. st.secrets.get("OPENAI_API_KEY")
# 2. os.environ.get("OPENAI_API_KEY")
# 3. None (stub mode)
```

### 5.3 Error Handling
- All AI calls wrapped in try/except
- Invalid JSON from AI → show error + allow retry
- Missing API key → graceful stub mode
- Database errors → user-friendly message

### 5.4 Caching Strategy
- Cache AI results in session state
- Cache expensive DB queries with `@st.cache_data`
- Clear cache explicitly when data changes

---

## 6. Domain Logic Specifications

### 6.1 Routing Engine (routing.py)

**Input:**
```python
class JobSpec:
    width_mm: int
    depth_mm: int
    height_mm: int
    material: str
    color_count: int
    priority: str  # low|normal|urgent
    minutes_estimated: float
```

**Output:**
```python
class RoutingResult:
    recommended_printer_id: int
    recommended_printer_name: str
    constraints_check: dict[str, bool]  # constraint_name → passed
    scoring_breakdown: dict[str, float]  # factor → points
    explanation: str  # Human-readable summary
```

**Constraint Checks:**
1. `fits_volume`: job dims <= printer dims
2. `supports_material`: material in printer's supported list
3. `supports_colors`: color_count == 1 OR printer.multicolor_enabled

**Scoring Factors:**
| Factor | Logic |
|--------|-------|
| urgency_match | +20 if urgent job on fast printer |
| reliability | printer.reliability_score × 30 |
| right_sizing | Penalize large printers for small jobs |
| availability | (Phase 6) Based on queued minutes |

### 6.2 Cost Engine (costing.py)

**All formulas must be transparent and editable:**

```python
def calculate_costs(
    grams: float,
    minutes: float,
    material: str,
    labor_minutes: float = 0,
    sell_price: float = 0,
    costs: CostConstants
) -> CostBreakdown:
    
    material_cost = grams * (costs.filament_usd_per_kg[material] / 1000)
    
    electricity_cost = (minutes / 60) * costs.kwh_per_hour * costs.usd_per_kwh
    
    labor_cost = (labor_minutes / 60) * costs.labor_usd_per_hour
    
    depreciation = (minutes / 60) * costs.depreciation_usd_per_hour
    
    platform_fees = sell_price * costs.platform_fee_pct
    
    total_cost = material_cost + electricity_cost + labor_cost + depreciation + costs.packaging_usd + platform_fees
    
    profit = sell_price - total_cost
    margin = profit / sell_price if sell_price > 0 else 0
    
    return CostBreakdown(...)
```

### 6.3 State Machine (states.py)

```python
ALLOWED_TRANSITIONS = {
    "queued": ["printing", "canceled"],
    "printing": ["completed", "failed", "canceled"],
    "completed": [],  # terminal
    "failed": [],     # terminal
    "canceled": [],   # terminal
}

TRANSITION_REQUIREMENTS = {
    ("printing", "completed"): ["finished_at"],
    ("printing", "failed"): ["failure_reason", "finished_at"],
}
```

---

## 7. AI Integration Specification

### 7.1 Client Wrapper (client.py)

```python
class AIClient:
    def evaluate_idea(self, idea: str, platform: str) -> IdeaEvaluation | AIError:
        """
        Returns structured evaluation or error.
        Uses stub data if no API key available.
        """
```

### 7.2 Response Schema (schemas.py)

```python
class IdeaEvaluation(BaseModel):
    category: str
    difficulty: int  # 1-5
    price_range_low: float
    price_range_high: float
    risks: list[str]
    suggested_materials: list[str]
    grams_estimate_low: float
    grams_estimate_high: float
    minutes_estimate_low: float
    minutes_estimate_high: float
    reasoning: str
```

### 7.3 Stub Mode
When no API key is available:
- Return sensible default values
- Mark outputs clearly as "STUB DATA - No API Key"
- Allow full UI testing without costs

---

## 8. UI Component Specifications

### 8.1 Home Page
- **KPI Row:** st.metric cards for:
  - Jobs in queue
  - Currently printing
  - Completed today
  - Failure rate (7 days)
- **"What's Next" Section:** Highest priority queued job

### 8.2 Facility Page
- **Tabs:** Add Job | Active Queue | History
- **Add Job Form:**
  - All fields from jobs table
  - "Get Recommendation" button
  - Show recommendation before saving
- **Queue Table:**
  - Filterable by status, printer
  - Action buttons: Start, Complete, Fail, Cancel

### 8.3 Business Page
- **Input:** Text area for product idea + platform dropdown
- **Output:**
  - AI estimate section (labeled clearly)
  - Cost breakdown with formula reveal
  - Profit/margin KPIs
  - "What-if" sliders for adjustments

### 8.4 Settings Page
- **Tabs:** Printers | Cost Constants
- **Printers Tab:**
  - Table of printers with edit/delete
  - Add printer form
- **Costs Tab:**
  - Editable key-value pairs
  - Defaults seeded on first run

### 8.5 Reports Page
- **Date range filter:** Affects all charts
- **Charts:**
  - Jobs by printer (bar)
  - Completion rate (pie)
  - Failures by material (bar)
  - Avg time by printer (bar)

---

## 9. Security Considerations

| Concern | Mitigation |
|---------|------------|
| API Key Exposure | Store in secrets.toml, never commit |
| SQL Injection | Use parameterized queries only |
| Input Validation | Validate all user inputs before DB |
| Error Leakage | Never expose stack traces to UI |

---

## 10. Performance Considerations

| Scenario | Approach |
|----------|----------|
| Large job tables | Pagination + filters |
| Expensive calculations | Cache with @st.cache_data |
| Multiple chart renders | Lazy loading |
| AI API calls | Cache results in session_state |
