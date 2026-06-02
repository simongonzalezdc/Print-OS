# Implementation Phases Guide
## Caedo API — Step-by-Step Build Instructions

**Version:** 1.0  
**Date:** December 25, 2025

---

This document provides detailed instructions for building Caedo API in sequential phases. Each phase has specific deliverables and acceptance criteria. **Complete each phase before moving to the next.**

---

## Phase 1: Skeleton + Theme + Navigation

### Objective
Create the project structure, dependencies, and basic Streamlit app with navigation.

### Tasks

#### 1.1 Project Setup
1. Create project directory structure as specified in TECH_SPEC.md
2. Create Python virtual environment
3. Create `requirements.txt` with dependencies:
   ```
   streamlit>=1.28.0
   pandas>=2.0.0
   plotly>=5.18.0
   pydantic>=2.5.0
   openai>=1.5.0
   python-dotenv>=1.0.0
   ```
4. Install dependencies

#### 1.2 Configuration Files
1. Create `.streamlit/config.toml` with theme:
   ```toml
   [theme]
   primaryColor = "#00E5FF"
   backgroundColor = "#0E1117"
   secondaryBackgroundColor = "#262730"
   textColor = "#FAFAFA"
   font = "sans serif"
   ```
2. Create `.gitignore` with standard exclusions
3. Create empty `.streamlit/secrets.toml` for API keys

#### 1.3 Application Skeleton
1. Create `app.py` as entrypoint with page configuration
2. Create placeholder pages in `pages/` directory:
   - `1_Home.py` — "Home" with placeholder content
   - `2_Facility.py` — "Facility" with placeholder content
   - `3_Business.py` — "Business Brain" with placeholder content
   - `4_Settings.py` — "Settings" with placeholder content
   - `5_Reports.py` — "Reports" with placeholder content
3. Create `caedoapi/` package with `__init__.py`

### Acceptance Criteria
- [ ] `streamlit run app.py` launches without errors
- [ ] Theme colors are applied (dark background, cyan accent)
- [ ] All 5 pages are visible in navigation
- [ ] Navigation between pages works
- [ ] Clean console output (no warnings)

### How to Verify
```bash
cd /path/to/caedoapi
source .venv/bin/activate
streamlit run app.py
# Open browser and verify navigation
```

---

## Phase 2: Database Init + Settings MVP

### Objective
Create SQLite database layer and Settings page for printers and costs.

### Tasks

#### 2.1 Database Layer
1. Create `caedoapi/db.py`:
   - `get_connection()` function (singleton pattern)
   - `init_db()` function that creates tables
   - On first run, creates `farm.db` in project root

2. Create tables (see DATABASE_SCHEMA.md):
   - `printers` table
   - `costs` table  
   - `events` table
   - Required indexes

3. Seed default cost constants on initialization

#### 2.2 Repository Layer
1. Create `caedoapi/repositories/printers_repo.py`:
   - `get_all()` → List[Printer]
   - `get_by_id(id)` → Printer | None
   - `create(printer)` → int (new id)
   - `update(id, printer)` → bool
   - `delete(id)` → bool

2. Create `caedoapi/repositories/costs_repo.py`:
   - `get_all()` → dict[str, any]
   - `get(key)` → any
   - `set(key, value, value_type)` → bool
   - `seed_defaults()` → None

#### 2.3 Settings Page
1. Build Settings page with two tabs:
   
   **Printers Tab:**
   - Table listing all printers
   - Add printer form with all fields:
     - Name (text)
     - Build dimensions X/Y/Z (number inputs with "mm" label)
     - Supported materials (multiselect)
     - Multicolor enabled (checkbox)
     - Max colors (number, conditional)
     - Speed tier (selectbox: slow/normal/fast)
     - Reliability score (slider 0.0-1.0)
     - Notes (text area)
   - Edit button per row → opens edit form
   - Delete button per row → confirmation dialog
   
   **Cost Constants Tab:**
   - Display all cost keys with current values
   - Edit button per row
   - Show value type indicator

### Acceptance Criteria
- [ ] `farm.db` created on first run
- [ ] Default cost constants seeded automatically
- [ ] Can add a new printer with all fields
- [ ] Printer persists after app refresh
- [ ] Can edit existing printer
- [ ] Can delete printer
- [ ] Can edit cost constants
- [ ] All values show appropriate units

### How to Verify
```bash
# Start app
streamlit run app.py

# Verify in browser:
# 1. Go to Settings > Printers
# 2. Add new printer "Test Kobra"
# 3. Refresh page - printer should still exist
# 4. Edit the printer's reliability score
# 5. Delete the printer
# 6. Go to Costs tab
# 7. Edit filament_usd_per_kg value
# 8. Verify farm.db exists in project root
```

---

## Phase 3: Facility — Jobs + Routing + Queue

### Objective
Create job management with intelligent printer routing.

### Tasks

#### 3.1 Jobs Repository
Create `caedoapi/repositories/jobs_repo.py`:
- `get_all(filters)` → List[Job]
- `get_by_id(id)` → Job | None
- `get_by_status(status)` → List[Job]
- `create(job)` → int
- `update(id, job)` → bool
- `update_status(id, status, extras)` → bool

#### 3.2 Events Repository
Create `caedoapi/repositories/events_repo.py`:
- `log_event(job_id, event_type, payload)` → int
- `get_by_job(job_id)` → List[Event]

#### 3.3 State Machine
Create `caedoapi/domain/states.py`:
- `ALLOWED_TRANSITIONS` constant
- `can_transition(from_status, to_status)` → bool
- `validate_transition(from_status, to_status, data)` → (bool, str)

#### 3.4 Routing Engine
Create `caedoapi/domain/routing.py`:
- `find_eligible_printers(job_spec, printers)` → List[Printer]
- `score_printers(job_spec, eligible)` → dict[int, ScoringResult]
- `recommend_printer(job_spec)` → RoutingResult

Implement constraints:
- Fits build volume
- Supports material
- Supports color count

Implement scoring:
- Urgency match (fast printers for urgent jobs)
- Reliability (weighted by print time)
- Right-sizing (penalty for oversized printers)

#### 3.5 Facility Page
Create tabbed interface:

**Tab: Add Job**
- Job name (required)
- Source dropdown (personal/etsy/friend/other)
- Dimensions: width, depth, height in mm (required)
- Material dropdown
- Color count (number, default 1)
- Estimated grams (optional)
- Estimated minutes (optional)
- Priority (low/normal/urgent)
- Due date (optional date picker)
- Notes (text area)

- "Get Recommendation" button:
  - Calls routing engine
  - Displays recommendation with explanation
  - Shows constraints pass/fail
  - Shows scoring breakdown
  
- "Create Job" button:
  - Saves job with status="queued"
  - Stores routing result in recommended_reason_json
  - Logs "job_created" event

**Tab: Active Queue**
- Filterable table of non-terminal jobs
- Filters: status, assigned printer, priority
- Columns: name, material, priority, status, assigned printer, created
- Action buttons per row:
  - Assign (if queued) → dropdown to select printer
  - Start (if queued + assigned) → changes to printing
  - Complete (if printing) → prompts for actual values
  - Fail (if printing) → prompts for reason
  - Cancel (if queued/printing) → confirmation

**Tab: History**
- Table of completed/failed/canceled jobs
- Date range filter
- Columns: name, printer, status, duration, outcome

### Acceptance Criteria
- [ ] Can create job with all fields
- [ ] Recommendation displays with explanation
- [ ] Constraints shown as pass/fail
- [ ] Scoring breakdown visible
- [ ] State transitions enforced (can't complete from queued)
- [ ] Complete requires actual values
- [ ] Fail requires reason
- [ ] Events logged for all transitions
- [ ] Queue filters work correctly

### How to Verify
```bash
# Prerequisites: At least 2 printers configured in Settings

# Test flow:
# 1. Add a job with small dimensions
# 2. Verify recommendation explains why that printer
# 3. Create the job
# 4. Assign a printer
# 5. Start the job (verify status changes)
# 6. Complete the job (enter actual values)
# 7. Verify appears in History

# Edge cases to test:
# - Job too large for any printer → should show error
# - Urgent job → should prefer fast printer
# - Multicolor job → should only show multicolor printers
```

---

## Phase 4: Reports

### Objective
Create analytics dashboard with Plotly charts.

### Tasks

#### 4.1 Reports Page
Build reports page with:

**Date Range Filter**
- Start date / End date pickers
- "Apply" button
- Default: last 30 days

**Charts (use Plotly):**

1. **Jobs by Printer** (horizontal bar)
   - X: count of jobs
   - Y: printer name
   - Color by status

2. **Completion Rate** (pie/donut)
   - Segments: completed, failed, canceled
   - Show percentages

3. **Failures by Material** (bar)
   - X: material type
   - Y: failure count
   - Only show if failures exist

4. **Average Time by Printer** (bar)
   - X: printer name
   - Y: average minutes (actual)
   - Only include completed jobs

**Additional Features:**
- Empty state messages when no data
- Loading indicators for queries
- Responsive layout using st.columns

### Acceptance Criteria
- [ ] All 4 charts render correctly
- [ ] Date filter affects all charts
- [ ] Charts are interactive (Plotly hover/zoom)
- [ ] Empty states handled gracefully
- [ ] Performance acceptable with 100+ jobs

### How to Verify
```bash
# Prerequisites: Multiple jobs in various states

# 1. Navigate to Reports
# 2. Verify all charts load
# 3. Change date range
# 4. Verify charts update
# 5. Hover over chart elements
# 6. Test with no data in range
```

---

## Phase 5: Business Brain (AI Integration)

### Objective
Implement AI-powered product idea evaluation with cost calculations.

### Tasks

#### 5.1 AI Client
Create `caedoapi/ai/client.py`:
- `get_api_key()` → str | None
- `is_api_available()` → bool
- `evaluate_idea(idea, platform)` → IdeaEvaluation | AIError

Features:
- Try `st.secrets` first, then `os.environ`
- Stub mode when no API key
- Timeout handling
- Error wrapping

#### 5.2 AI Schemas
Create `caedoapi/ai/schemas.py`:
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

#### 5.3 Cost Engine
Create `caedoapi/domain/costing.py`:
- `calculate_material_cost(grams, material, costs)` → float
- `calculate_electricity_cost(minutes, costs)` → float
- `calculate_total_cost(params, costs)` → CostBreakdown
- `calculate_profit_margin(sell_price, total_cost)` → (profit, margin)

All functions must accept costs dict from settings.

#### 5.4 Business Page

**Input Section:**
- Large text area for product idea
- Platform dropdown (Etsy, Amazon, Local, Other)
- "Evaluate" button

**AI Estimate Section:** (labeled clearly as AI)
- Category badge
- Difficulty rating (1-5 stars or bar)
- Price range display
- Risks as bullet list
- Suggested materials as tags
- Time/material estimates

**Cost Analysis Section:** (uses stored constants)
- Material cost (with formula expandable)
- Electricity cost (with formula expandable)
- Labor cost (if enabled)
- Depreciation (if enabled)
- Platform fees
- Packaging
- **Total cost**

**Profitability Section:**
- Sell price input (editable)
- Gross profit = sell price - total cost
- Margin percentage
- Break-even quantity

**What-If Adjustments:**
- Sliders for quantity, labor minutes
- Auto-recalculate on change

**Formula Reveal:**
- Expandable sections showing exact formulas
- Link to Settings for changing constants

### Acceptance Criteria
- [ ] Works without API key (stub mode)
- [ ] Clear "AI Estimate" labeling
- [ ] Stub data clearly marked as stub
- [ ] With API key, real responses work
- [ ] Invalid JSON handled gracefully
- [ ] All costs calculated from Settings values
- [ ] Formulas visible/expandable
- [ ] What-if sliders work
- [ ] Results cached in session

### How to Verify
```bash
# Without API key:
# 1. Ensure no API key in secrets
# 2. Go to Business page
# 3. Enter an idea, click Evaluate
# 4. Verify stub response displayed
# 5. Verify clearly marked as stub

# With API key:
# 1. Add OPENAI_API_KEY to .streamlit/secrets.toml
# 2. Restart app
# 3. Enter real product idea
# 4. Verify AI response received
# 5. Verify cost calculations match Settings values
```

---

## Phase 6: Scheduling / Availability (Optional Enhancement)

### Objective
Add printer availability tracking for smarter scheduling.

### Tasks

#### 6.1 Availability Calculation
- Sum queued minutes per assigned printer
- Calculate estimated start/finish times
- Add "soonest available" to routing score

#### 6.2 UI Enhancements
- Show queue depth per printer
- Estimated start time on job creation
- "Optimize batch" suggestions

### Acceptance Criteria
- [ ] Availability shown in routing recommendation
- [ ] Estimated times displayed
- [ ] Updates when jobs change

---

## Quality Checklist (All Phases)

Apply these checks at the end of each phase:

- [ ] No hardcoded printer specs
- [ ] No hardcoded cost values
- [ ] All values show units (mm, g, min, $)
- [ ] All AI outputs labeled as estimates
- [ ] All formulas expose their inputs
- [ ] No API keys in code
- [ ] Errors show user-friendly messages
- [ ] Console has no warnings
- [ ] App responsive on window resize
