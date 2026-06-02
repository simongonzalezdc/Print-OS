-- Initial schema for Print-OS
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
    api_type TEXT NOT NULL DEFAULT 'none' CHECK (api_type IN ('none', 'octoprint', 'moonraker')),
    api_url TEXT NULL,
    api_key TEXT NULL,
    ip_address TEXT NULL,
    current_status TEXT NOT NULL DEFAULT 'offline',
    notes TEXT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

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

CREATE TABLE IF NOT EXISTS events (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id INTEGER NOT NULL,
    event_type TEXT NOT NULL,
    payload_json TEXT NOT NULL DEFAULT '{}',
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    FOREIGN KEY (job_id) REFERENCES jobs(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS costs (
    key TEXT PRIMARY KEY,
    value_type TEXT NOT NULL CHECK (value_type IN ('number', 'text', 'json')),
    value_text TEXT NOT NULL,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_usage (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    client_id TEXT NULL,
    feature TEXT NOT NULL,
    endpoint TEXT NULL,
    model TEXT NOT NULL,
    prompt_tokens INTEGER NOT NULL,
    completion_tokens INTEGER NOT NULL,
    total_tokens INTEGER NOT NULL,
    cost_usd REAL NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS ai_memory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    category TEXT NOT NULL,
    content TEXT NOT NULL,
    importance REAL DEFAULT 0.5,
    source_design_id INTEGER NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS inventory (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    material TEXT NOT NULL,
    color TEXT NOT NULL,
    weight_g REAL NOT NULL,
    cost_per_kg REAL NULL,
    status TEXT NOT NULL DEFAULT 'in_stock' CHECK (status IN ('in_stock', 'low', 'out_of_stock')),
    min_threshold_g REAL NOT NULL DEFAULT 200.0,
    updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_jobs_status ON jobs(status);
CREATE INDEX IF NOT EXISTS idx_jobs_assigned_printer ON jobs(assigned_printer_id);
CREATE INDEX IF NOT EXISTS idx_jobs_created_at ON jobs(created_at);
CREATE INDEX IF NOT EXISTS idx_events_job_id ON events(job_id);
CREATE INDEX IF NOT EXISTS idx_ai_usage_feature ON ai_usage(feature);
CREATE INDEX IF NOT EXISTS idx_ai_usage_created_at ON ai_usage(created_at);
