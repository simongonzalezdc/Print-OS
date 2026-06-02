# UI Component Specification
## Caedo API — Streamlit Page Designs

**Version:** 1.0  
**Date:** December 25, 2025

---

## 1. Global Layout Standards

### Theme
- **Background:** `#0E1117` (dark)
- **Secondary Background:** `#262730`
- **Primary Accent:** `#00E5FF` (cyan)
- **Text:** `#FAFAFA` (off-white)
- **Font:** Sans-serif (system default)

### Page Structure
Every page follows this structure:
```python
import streamlit as st

st.set_page_config(
    page_title="Page Name — Caedo API",
    page_icon="🖨️",
    layout="wide"
)

st.title("Page Title")
# Page content...
```

### Component Guidelines
| Component | Usage |
|-----------|-------|
| `st.metric` | KPIs and key numbers |
| `st.dataframe` | Tables with sortable data |
| `st.data_editor` | Editable tables |
| `st.form` | Multi-field input forms |
| `st.tabs` | Grouping related sections |
| `st.expander` | Hiding optional details |
| `st.columns` | Horizontal layouts |
| Plotly charts | All visualizations |

### Units Display
All numeric values must include units:
- Dimensions: `{value} mm`
- Weight: `{value} g` or `{value} kg`
- Time: `{value} min` or `{value} hrs`
- Currency: `${value:.2f}`

---

## 2. Home Page (1_Home.py)

### Purpose
Dashboard overview showing today's status and next actions.

### Layout
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏠 Home                                                         │
├─────────────────────────────────────────────────────────────────┤
│                         KPI Row                                  │
│  ┌───────────┬───────────┬───────────┬───────────┐             │
│  │  Queued   │ Printing  │ Completed │ Fail Rate │             │
│  │    12     │     3     │  Today: 5 │   4.2%    │             │
│  │  ↑ 2      │           │           │  (7 days) │             │
│  └───────────┴───────────┴───────────┴───────────┘             │
├─────────────────────────────────────────────────────────────────┤
│                     What's Next                                  │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ 🔴 URGENT: Phone Stand v2 — PLA — Kobra 3                 │  │
│  │ Due: Today 5:00 PM | Est: 45 min                          │  │
│  │ [View Job]                                                 │  │
│  └───────────────────────────────────────────────────────────┘  │
├─────────────────────────────────────────────────────────────────┤
│                  Currently Printing                              │
│  ┌─────────────────────────────────────────────────────────┐    │
│  │ Job Name        │ Printer   │ Started    │ Est. Done   │    │
│  ├─────────────────┼───────────┼────────────┼─────────────┤    │
│  │ Keychain Batch  │ Kobra S1  │ 2:30 PM    │ 3:45 PM     │    │
│  └─────────────────────────────────────────────────────────┘    │
└─────────────────────────────────────────────────────────────────┘
```

### Components

#### KPI Row (4 columns)
```python
col1, col2, col3, col4 = st.columns(4)
with col1:
    st.metric("Queued", 12, delta=2)
with col2:
    st.metric("Printing", 3)
with col3:
    st.metric("Completed Today", 5)
with col4:
    st.metric("Fail Rate (7d)", "4.2%", delta="-0.5%", delta_color="inverse")
```

#### What's Next Section
- Shows highest priority queued job
- Priority badge (color-coded: 🔴 urgent, 🟡 normal, 🟢 low)
- Quick action: "View Job" links to Facility page
- Empty state: "No jobs in queue"

#### Currently Printing Table
- Simple dataframe of printing jobs
- Columns: Job Name, Printer, Started, Est. Done
- Empty state: "No active prints"

---

## 3. Facility Page (2_Facility.py)

### Purpose
Job management: create, queue, track, complete.

### Layout Structure
```
┌─────────────────────────────────────────────────────────────────┐
│ 🏭 Facility                                                      │
├─────────────────────────────────────────────────────────────────┤
│  [ Add Job ]  [ Active Queue ]  [ History ]                     │
├─────────────────────────────────────────────────────────────────┤
│                    (Tab Content)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tab 1: Add Job

```
┌─────────────────────────────────────────────────────────────────┐
│                        Add New Job                               │
├─────────────────────────────────────────────────────────────────┤
│  Job Name:        [________________________]                     │
│  Source:          [personal ▼]                                   │
│                                                                  │
│  ── Dimensions ──                                                │
│  Width:  [___] mm    Depth: [___] mm    Height: [___] mm        │
│                                                                  │
│  ── Print Settings ──                                            │
│  Material: [PLA ▼]      Colors: [1]                             │
│                                                                  │
│  ── Estimates ──                                                 │
│  Grams: [___] g         Minutes: [___] min                      │
│                                                                  │
│  ── Priority ──                                                  │
│  [○ Low] [● Normal] [○ Urgent]    Due Date: [📅 None]           │
│                                                                  │
│  Notes: [____________________________________________]           │
│                                                                  │
│            [ Get Recommendation ]                                │
├─────────────────────────────────────────────────────────────────┤
│                    📋 Recommendation                             │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ ✅ Recommended: Kobra 3                                    │  │
│  │                                                            │  │
│  │ Constraints:                                               │  │
│  │   ✓ Fits build volume (120×80×50 mm fits 220×220×250)    │  │
│  │   ✓ Supports PLA                                          │  │
│  │   ✓ Single color (no multicolor needed)                   │  │
│  │                                                            │  │
│  │ Scoring:                                                   │  │
│  │   • Reliability: 27.0 pts (0.90 × 30)                     │  │
│  │   • Right-sizing: 15.0 pts (good fit)                     │  │
│  │   • Urgency match: 10.0 pts                               │  │
│  │   ────────────────────────                                 │  │
│  │   Total: 52.0 pts                                          │  │
│  │                                                            │  │
│  │ "Selected Kobra 3 for its high reliability and            │  │
│  │  appropriately sized build volume."                        │  │
│  └───────────────────────────────────────────────────────────┘  │
│                                                                  │
│     [ Create Job with Recommended Printer ]                      │
│     [ Choose Different Printer... ]                              │
└─────────────────────────────────────────────────────────────────┘
```

### Tab 2: Active Queue

```
┌─────────────────────────────────────────────────────────────────┐
│ Filters:  Status: [All ▼]  Printer: [All ▼]  Priority: [All ▼] │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Name          │ Material │Pri │ Status  │ Printer  │Actions│  │
│ ├───────────────┼──────────┼────┼─────────┼──────────┼───────┤  │
│ │ Phone Stand   │ PLA      │ 🔴 │ queued  │ —        │[▼]    │  │
│ │ Keychain x50  │ PETG     │ 🟡 │ printing│ Kobra S1 │[▼]    │  │
│ │ Vase Batch    │ PLA      │ 🟢 │ queued  │ Kobra 3  │[▼]    │  │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

**Action Dropdown Options:**
- Queued: Assign Printer, Start Print, Cancel
- Printing: Mark Complete, Mark Failed, Cancel

### Tab 3: History

```
┌─────────────────────────────────────────────────────────────────┐
│ Date Range: [📅 Start] to [📅 End]   [Apply Filter]             │
├─────────────────────────────────────────────────────────────────┤
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Name       │ Printer │ Status    │ Duration │ Date       │   │
│ ├────────────┼─────────┼───────────┼──────────┼────────────┤   │
│ │ Box Lid    │ Kobra 3 │ ✅ Done   │ 32 min   │ Dec 24     │   │
│ │ Gear Set   │ KobraS1 │ ❌ Failed │ 15 min   │ Dec 24     │   │
│ │ Stand v1   │ Kobra 3 │ 🚫 Cancel │ —        │ Dec 23     │   │
│ └───────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

---

## 4. Business Page (3_Business.py)

### Purpose
AI-powered product idea evaluation with cost calculations.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 💡 Business Brain                                                │
├─────────────────────────────────────────────────────────────────┤
│                        Evaluate Your Idea                        │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │ Describe your product idea:                                │  │
│  │ [                                                          ]│  │
│  │ [                                                          ]│  │
│  │ [____________________________________________________________]│  │
│  └───────────────────────────────────────────────────────────┘  │
│  Platform: [Etsy ▼]                                              │
│                                                                  │
│                    [ 🔍 Evaluate Idea ]                          │
├─────────────────────────────────────────────────────────────────┤
│ ⚠️ AI ESTIMATE — Values are approximations                       │
│ ┌───────────────────────────────────────────────────────────┐   │
│ │ Category: Home Decor         Difficulty: ★★★☆☆ (3/5)      │   │
│ │                                                            │   │
│ │ Price Range: $15.00 - $25.00                              │   │
│ │                                                            │   │
│ │ Suggested Materials: [PLA] [PETG]                         │   │
│ │                                                            │   │
│ │ Estimates:                                                 │   │
│ │   • Time: 30-45 min                                       │   │
│ │   • Material: 25-40 g                                      │   │
│ │                                                            │   │
│ │ Risks:                                                     │   │
│ │   • High competition in category                          │   │
│ │   • Seasonal demand may vary                              │   │
│ └───────────────────────────────────────────────────────────┘   │
├─────────────────────────────────────────────────────────────────┤
│                    💰 Cost Analysis                              │
│  (Based on your Settings — uses real numbers)                    │
│                                                                  │
│  ┌───────────┬───────────┬───────────┬───────────┐             │
│  │ Material  │ Electric  │ Fees      │TOTAL COST │             │
│  │  $0.52    │  $0.09    │  $2.60    │   $4.71   │             │
│  └───────────┴───────────┴───────────┴───────────┘             │
│                                                                  │
│  [▶ Show calculation details]                                    │
│                                                                  │
│  Sell Price:  [$______20.00]                                     │
│                                                                  │
│  ┌───────────┬───────────┬───────────┐                         │
│  │  PROFIT   │  MARGIN   │ Break-even│                         │
│  │  $15.29   │   76.5%   │  1 unit   │                         │
│  └───────────┴───────────┴───────────┘                         │
├─────────────────────────────────────────────────────────────────┤
│                    🔧 What-If Adjustments                        │
│                                                                  │
│  Quantity: [────●────] 10 units                                  │
│  Labor (min): [──●──────] 5 min                                  │
│                                                                  │
│  Batch profit: $147.90                                           │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

#### AI Estimate Box
- Clear warning banner: "AI ESTIMATE"
- Stub mode shows: "STUB DATA - Configure API key for real estimates"
- Structured display of all AI-returned fields

#### Cost Breakdown Expander
```python
with st.expander("Show calculation details"):
    st.markdown("""
    **Material cost:** 32g × ($20.00/kg ÷ 1000) = **$0.64**
    
    **Electricity:** (35 min ÷ 60) × 0.15 kWh × $0.12/kWh = **$0.01**
    
    **Platform fee:** $20.00 × 13% = **$2.60**
    
    **Packaging:** **$1.50**
    
    [Edit these values in Settings →]
    """)
```

#### What-If Sliders
- Real-time recalculation
- Use `st.session_state` for reactivity

---

## 5. Settings Page (4_Settings.py)

### Purpose
Configure printers and cost constants.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ ⚙️ Settings                                                       │
├─────────────────────────────────────────────────────────────────┤
│  [ Printers ]  [ Cost Constants ]                                │
├─────────────────────────────────────────────────────────────────┤
│                    (Tab Content)                                 │
└─────────────────────────────────────────────────────────────────┘
```

### Tab 1: Printers

```
┌─────────────────────────────────────────────────────────────────┐
│                      Your Printers                               │
│ ┌────────────────────────────────────────────────────────────┐  │
│ │ Name     │ Build Vol (mm)  │ Materials│ Speed │ Rel. │ ⚙️  │  │
│ ├──────────┼─────────────────┼──────────┼───────┼──────┼────┤  │
│ │ Kobra S1 │ 220×220×250     │ PLA,PETG │ fast  │ 0.92 │ ✏️🗑️│  │
│ │ Kobra 3  │ 220×220×250     │ PLA,PETG │ normal│ 0.90 │ ✏️🗑️│  │
│ │ Kobra Max│ 400×400×450     │ PLA,PETG │ slow  │ 0.85 │ ✏️🗑️│  │
│ └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│                    ➕ Add New Printer                            │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Name: [________________]                                    │ │
│  │                                                             │ │
│  │ Build Volume (mm):                                          │ │
│  │   X: [220]    Y: [220]    Z: [250]                         │ │
│  │                                                             │ │
│  │ Supported Materials:                                        │ │
│  │   [✓] PLA  [✓] PETG  [ ] TPU  [ ] ABS  [ ] ASA            │ │
│  │                                                             │ │
│  │ [ ] Multicolor Enabled    Max Colors: [4]                  │ │
│  │                                                             │ │
│  │ Speed Tier: [normal ▼]                                     │ │
│  │                                                             │ │
│  │ Reliability: [────────●──] 0.90                            │ │
│  │                                                             │ │
│  │ Notes: [________________________________]                   │ │
│  │                                                             │ │
│  │                    [ Add Printer ]                          │ │
│  └────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Tab 2: Cost Constants

```
┌─────────────────────────────────────────────────────────────────┐
│                     Cost Constants                               │
│                                                                  │
│  These values are used in all cost calculations.                 │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐ │
│  │ Setting                      │ Value           │ Actions   │ │
│  ├──────────────────────────────┼─────────────────┼───────────┤ │
│  │ Filament $/kg (by material)  │ PLA:$20 PETG:$25│ [Edit]    │ │
│  │ Electricity $/kWh            │ $0.12           │ [Edit]    │ │
│  │ Printer kWh/hour             │ 0.15            │ [Edit]    │ │
│  │ Labor $/hour                 │ $0.00 (disabled)│ [Edit]    │ │
│  │ Depreciation $/print hour    │ $0.10           │ [Edit]    │ │
│  │ Platform fee %               │ 13%             │ [Edit]    │ │
│  │ Packaging $/order            │ $1.50           │ [Edit]    │ │
│  └────────────────────────────────────────────────────────────┘ │
│                                                                  │
│  💡 Tip: Set Labor $/hour to 0 to exclude labor from costs      │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Reports Page (5_Reports.py)

### Purpose
Analytics and insights from job history.

### Layout

```
┌─────────────────────────────────────────────────────────────────┐
│ 📊 Reports                                                       │
├─────────────────────────────────────────────────────────────────┤
│  Date Range: [📅 Dec 1] to [📅 Dec 25]     [Apply]              │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────────────┬─────────────────────────┐          │
│  │   Jobs by Printer       │   Completion Rate       │          │
│  │   [Horizontal Bar]      │   [Pie Chart]          │          │
│  │                         │                         │          │
│  │   ████████ Kobra S1: 45│   ▓▓▓▓▓▓ 78% Done     │          │
│  │   ██████ Kobra 3: 32   │   ░░ 15% Failed        │          │
│  │   ███ Kobra Max: 12    │   ░ 7% Canceled        │          │
│  └─────────────────────────┴─────────────────────────┘          │
│                                                                  │
│  ┌─────────────────────────┬─────────────────────────┐          │
│  │   Failures by Material  │   Avg Time by Printer  │          │
│  │   [Bar Chart]           │   [Bar Chart]          │          │
│  │                         │                         │          │
│  │   TPU: 5   ████        │   Kobra S1: 28 min     │          │
│  │   PETG: 3  ██          │   Kobra 3: 35 min       │          │
│  │   PLA: 2   █           │   Kobra Max: 55 min     │          │
│  └─────────────────────────┴─────────────────────────┘          │
└─────────────────────────────────────────────────────────────────┘
```

### Chart Specifications

#### Jobs by Printer (Horizontal Bar)
```python
import plotly.express as px

fig = px.bar(
    df, 
    x='count', 
    y='printer_name',
    color='status',
    orientation='h',
    title='Jobs by Printer'
)
st.plotly_chart(fig, use_container_width=True)
```

#### Completion Rate (Pie/Donut)
```python
fig = px.pie(
    df,
    values='count',
    names='status',
    hole=0.4,  # Donut style
    title='Completion Rate'
)
st.plotly_chart(fig, use_container_width=True)
```

### Empty State Handling
```python
if df.empty:
    st.info("No data available for the selected date range. "
            "Complete some jobs to see reports!")
```

---

## 7. Modal/Dialog Patterns

### Complete Job Modal
```python
with st.form("complete_job"):
    st.subheader("Complete Job")
    grams_actual = st.number_input("Actual grams used", min_value=0.0)
    minutes_actual = st.number_input("Actual minutes", min_value=0.0)
    notes = st.text_area("Notes (optional)")
    
    if st.form_submit_button("Mark Complete"):
        # Update job...
```

### Fail Job Modal
```python
FAILURE_REASONS = [
    "Adhesion failure",
    "Layer separation", 
    "Clog/filament jam",
    "Power failure",
    "Other"
]

with st.form("fail_job"):
    st.subheader("Mark Job as Failed")
    reason = st.selectbox("Failure reason", FAILURE_REASONS)
    details = st.text_area("Additional details")
    
    if st.form_submit_button("Mark Failed"):
        # Update job...
```

### Delete Confirmation
```python
with st.expander("⚠️ Danger Zone"):
    st.warning("This action cannot be undone.")
    if st.button("Delete Printer", type="secondary"):
        # Delete...
```

---

## 8. Validation Feedback Patterns

### Success
```python
st.success("✅ Printer added successfully!")
```

### Error
```python
st.error("❌ Job dimensions exceed all available printers.")
```

### Warning
```python
st.warning("⚠️ No API key configured. Using stub data.")
```

### Info
```python
st.info("💡 Add printers in Settings before creating jobs.")
```
