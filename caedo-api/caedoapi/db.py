import sqlite3
import os
from contextlib import contextmanager

DB_PATH = os.getenv("PFOS_DB_PATH", "farm.db")

from caedoapi.utils.logger import logger

def get_connection():
    """Returns a connection to the SQLite database with optimized pragmas."""
    conn = sqlite3.connect(DB_PATH, timeout=30.0) # 30s busy timeout
    conn.row_factory = sqlite3.Row
    
    # Enable essential pragmas for reliability and performance
    conn.execute("PRAGMA foreign_keys = ON;")
    conn.execute("PRAGMA journal_mode = WAL;")
    conn.execute("PRAGMA synchronous = NORMAL;")
    
    return conn

@contextmanager
def get_db():
    conn = get_connection()
    try:
        yield conn
    finally:
        conn.close()

def init_db():
    """Initializes the database with migrations and default values."""
    with get_db() as conn:
        # 1. Create migrations table
        conn.execute("""
            CREATE TABLE IF NOT EXISTS schema_migrations (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                version TEXT UNIQUE NOT NULL,
                applied_at TEXT NOT NULL DEFAULT (datetime('now'))
            );
        """)

        # 2. Run incremental migrations
        migrations_dir = os.path.join(os.path.dirname(__file__), "migrations")
        if os.path.exists(migrations_dir):
            migration_files = sorted([f for f in os.listdir(migrations_dir) if f.endswith(".sql")])
            for filename in migration_files:
                # Check if already applied
                applied = conn.execute("SELECT 1 FROM schema_migrations WHERE version = ?", (filename,)).fetchone()
                if not applied:
                    logger.info(f"Applying migration: {filename}")
                    with open(os.path.join(migrations_dir, filename), "r") as f:
                        sql = f.read()
                        conn.executescript(sql)
                    conn.execute("INSERT INTO schema_migrations (version) VALUES (?)", (filename,))
        
        # 3. Seed Default Costs (remains the same)
        shared_materials_path = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "shared", "materials.json")
        default_filament_config = '{"PLA": 20.0, "PETG": 25.0, "TPU": 35.0, "ABS": 22.0, "ASA": 28.0}'
        
        if os.path.exists(shared_materials_path):
            try:
                import json
                with open(shared_materials_path, 'r') as f:
                    shared_data = json.load(f)
                    mat_map = {m['name']: m['usd_per_kg'] for m in shared_data.get('materials', [])}
                    if mat_map:
                        default_filament_config = json.dumps(mat_map)
            except Exception as e:
                logger.warning(f"Failed to load shared materials: {e}")

        default_costs = [
            ('filament_usd_per_kg', 'json', default_filament_config),
            ('electricity_usd_per_kwh', 'number', '0.12'),
            ('printer_kwh_per_hour', 'number', '0.15'),
            ('labor_usd_per_hour', 'number', '0.0'),
            ('depreciation_usd_per_hour', 'number', '0.10'),
            ('platform_fee_pct', 'number', '0.13'),
            ('packaging_usd_per_order', 'number', '1.50')
        ]
        
        for key, vtype, vtext in default_costs:
            conn.execute("""
                INSERT OR IGNORE INTO costs (key, value_type, value_text)
                VALUES (?, ?, ?)
            """, (key, vtype, vtext))
        
        conn.commit()

if __name__ == "__main__":
    init_db()
    logger.info("Database initialized successfully.")
