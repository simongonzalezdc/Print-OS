# Database Schema Specification
## Caedo API — SQLite Schema Design

**Version:** 1.0  
**Date:** December 25, 2025  
**Database:** SQLite (`farm.db`)

---

## 1. Overview

The database uses SQLite for local-first persistence. All timestamps are stored as ISO 8601 strings in UTC. JSON data is stored as TEXT columns and parsed in Python.

---

## 2. Entity Relationship Diagram

```
┌─────────────────┐       ┌─────────────────┐
│    printers     │       │      costs      │
├─────────────────┤       ├─────────────────┤
│ id (PK)         │       │ key (PK)        │
│ name            │       │ value_type      │
│ build_x_mm      │       │ value_text      │
│ build_y_mm      │       │ updated_at      │
│ build_z_mm      │       └─────────────────┘
│ supports_mats   │
│ multicolor      │
│ max_colors      │
│ speed_tier      │
│ reliability     │
└────────┬────────┘
         │
         │ 1:N (recommended)
         │ 1:N (assigned)
         ▼
┌─────────────────────────────────────────┐
│                  jobs                    │
├─────────────────────────────────────────┤
│ id (PK)                                 │
│ name, source, dimensions, material      │
│ color_count, grams_estimated, etc.      │
│ recommended_printer_id (FK → printers)  │
│ assigned_printer_id (FK → printers)     │
│ status, timestamps                      │
└────────────────┬────────────────────────┘
                 │
                 │ 1:N
                 ▼
        ┌─────────────────┐
        │     events      │
        ├─────────────────┤
        │ id (PK)         │
        │ job_id (FK)     │
        │ event_type      │
        │ payload_json    │
        │ created_at      │
        └─────────────────┘
```

---

## 3. Table Definitions

### 3.1 printers

Stores printer profiles with capabilities and reliability metrics.

```sql
CREATE TABLE IF NOT EXISTS printers (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT UNIQUE NOT NULL,
    build_x_mm INTEGER NOT NULL,
    build_y_mm INTEGER NOT NULL,
    build_z_mm INTEGER NOT NULL,
    supports_materials_json TEXT NOT NULL DEFAULT '["PLA"]',
    multicolor_enabled INTEGER NOT NULL DEFAULT 0,
    max_colors INTEGER NULL,
    speed_tier TEXT NOT NULL DEFAULT 'normal' CHECK (speed_tier IN ('slow', 'normal', 'fast')),
    reliability_score REAL NOT NULL DEFAULT 0.9 CHECK (reliability_score >= 0 AND reliability_score <= 1),
    notes TEXT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| name | TEXT | UNIQUE, NOT NULL | Printer display name |
| build_x_mm | INTEGER | NOT NULL | Build volume X (mm) |
| build_y_mm | INTEGER | NOT NULL | Build volume Y (mm) |
| build_z_mm | INTEGER | NOT NULL | Build volume Z (mm) |
| supports_materials_json | TEXT | NOT NULL | JSON array of materials e.g. `["PLA","PETG"]` |
| multicolor_enabled | INTEGER | NOT NULL | Boolean 0/1 |
| max_colors | INTEGER | NULL | Max colors if multicolor |
| speed_tier | TEXT | NOT NULL | `slow`, `normal`, or `fast` |
| reliability_score | REAL | NOT NULL | 0.0 to 1.0 |
| notes | TEXT | NULL | Freeform notes |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |

---

### 3.2 jobs

Core job tracking table with full lifecycle data.

```sql
CREATE TABLE IF NOT EXISTS jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'personal' CHECK (source IN ('personal', 'etsy', 'friend', 'other')),
    width_mm INTEGER NOT NULL,
    depth_mm INTEGER NOT NULL,
    height_mm INTEGER NOT NULL,
    material TEXT NOT NULL,
    color_count INTEGER NOT NULL DEFAULT 1,
    grams_estimated REAL NULL,
    minutes_estimated REAL NULL,
    priority TEXT NOT NULL DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'urgent')),
    due_at TEXT NULL,
    status TEXT NOT NULL DEFAULT 'queued' CHECK (status IN ('queued', 'printing', 'completed', 'failed', 'canceled')),
    recommended_printer_id INTEGER NOT NULL,
    recommended_reason_json TEXT NOT NULL,
    assigned_printer_id INTEGER NULL,
    started_at TEXT NULL,
    finished_at TEXT NULL,
    grams_actual REAL NULL,
    minutes_actual REAL NULL,
    failure_reason TEXT NULL,
    notes TEXT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (recommended_printer_id) REFERENCES printers(id),
    FOREIGN KEY (assigned_printer_id) REFERENCES printers(id)
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| name | TEXT | NOT NULL | Job display name |
| source | TEXT | NOT NULL | `personal`, `etsy`, `friend`, `other` |
| width_mm | INTEGER | NOT NULL | Part width (mm) |
| depth_mm | INTEGER | NOT NULL | Part depth (mm) |
| height_mm | INTEGER | NOT NULL | Part height (mm) |
| material | TEXT | NOT NULL | Material type (e.g., "PLA") |
| color_count | INTEGER | NOT NULL | Number of colors needed |
| grams_estimated | REAL | NULL | Slicer estimate (grams) |
| minutes_estimated | REAL | NULL | Slicer estimate (minutes) |
| priority | TEXT | NOT NULL | `low`, `normal`, `urgent` |
| due_at | TEXT | NULL | ISO 8601 deadline |
| status | TEXT | NOT NULL | Current lifecycle state |
| recommended_printer_id | INTEGER | NOT NULL, FK | System recommendation |
| recommended_reason_json | TEXT | NOT NULL | JSON explanation of routing decision |
| assigned_printer_id | INTEGER | NULL, FK | User-confirmed assignment |
| started_at | TEXT | NULL | When print started |
| finished_at | TEXT | NULL | When print ended |
| grams_actual | REAL | NULL | Actual material used |
| minutes_actual | REAL | NULL | Actual time taken |
| failure_reason | TEXT | NULL | Why job failed |
| notes | TEXT | NULL | Freeform notes |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |

---

### 3.3 events

Audit trail of all job state changes and significant events.

```sql
CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| id | INTEGER | PK, AUTO | Unique identifier |
| job_id | INTEGER | NOT NULL, FK | Related job |
| event_type | TEXT | NOT NULL | Event name (see below) |
| payload_json | TEXT | NOT NULL | Event-specific data |
| created_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Standard Event Types:**
- `job_created` — Job added to queue
- `job_started` — Status changed to printing
- `job_completed` — Status changed to completed
- `job_failed` — Status changed to failed
- `job_canceled` — Status changed to canceled
- `printer_assigned` — Printer assignment changed

---

### 3.4 costs

Extensible key-value store for cost constants.

```sql
CREATE TABLE IF NOT EXISTS costs (
    key TEXT PRIMARY KEY,
    value_type TEXT NOT NULL CHECK (value_type IN ('number', 'text', 'json')),
    value_text TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);
```

| Column | Type | Constraints | Description |
|--------|------|-------------|-------------|
| key | TEXT | PK | Unique identifier |
| value_type | TEXT | NOT NULL | `number`, `text`, or `json` |
| value_text | TEXT | NOT NULL | Stored value (parse by type) |
| updated_at | TEXT | NOT NULL | ISO 8601 timestamp |

**Default Cost Keys (seed on init):**

| Key | Type | Default Value | Description |
|-----|------|---------------|-------------|
| `filament_usd_per_kg` | json | `{"PLA": 20, "PETG": 25, "TPU": 35}` | Cost per material type |
| `electricity_usd_per_kwh` | number | `0.12` | Electric rate |
| `printer_kwh_per_hour` | number | `0.15` | Average consumption |
| `labor_usd_per_hour` | number | `0` | Labor rate (0 = disabled) |
| `depreciation_usd_per_hour` | number | `0.10` | Equipment depreciation |
| `platform_fee_pct` | number | `0.13` | Marketplace fee (13%) |
| `packaging_usd_per_order` | number | `1.50` | Packaging cost |

---

## 4. Indexes

Create these indexes for query performance:

```sql
CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_printer ON jobs(assigned_printer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_events_job_id ON events(job_id);
```

---

## 5. recommended_reason_json Format

The routing engine stores its decision in JSON:

```json
{
  "recommended_printer_id": 1,
  "recommended_printer_name": "Kobra 3",
  "constraints": {
    "fits_volume": true,
    "supports_material": true,
    "supports_colors": true
  },
  "eligible_printers": [1, 2],
  "scores": {
    "1": {
      "urgency_match": 10,
      "reliability": 27,
      "right_sizing": 15,
      "total": 52
    },
    "2": {
      "urgency_match": 10,
      "reliability": 25,
      "right_sizing": 8,
      "total": 43
    }
  },
  "explanation": "Kobra 3 selected: Best fit for normal priority PLA job. High reliability (0.9) and appropriately sized build volume."
}
```

---

## 6. Database Initialization Flow

```python
def init_db():
    """Initialize database on first run."""
    conn = get_connection()
    
    # 1. Create tables
    conn.executescript(CREATE_TABLES_SQL)
    
    # 2. Seed default costs (if not exist)
    seed_default_costs(conn)
    
    # 3. Create indexes
    conn.executescript(CREATE_INDEXES_SQL)
    
    conn.commit()
```

---

## 7. Migration Strategy (MVP)

For MVP, use "migrations-lite":
- On startup, run CREATE TABLE IF NOT EXISTS
- New columns added with ALTER TABLE ... ADD COLUMN
- Never drop columns or tables in production
- For breaking changes, create new table + migrate data

```python
def apply_migrations(conn):
    """Add missing columns safely."""
    # Example: Adding a new optional column
    try:
        conn.execute("SELECT new_column FROM jobs LIMIT 1")
    except sqlite3.OperationalError:
        conn.execute("ALTER TABLE jobs ADD COLUMN new_column TEXT NULL")
```
