# Caedo API

**3D Print Farm Decision Support System**

A Streamlit-based dashboard for managing personal 3D print farms. Route jobs intelligently, track costs transparently, and evaluate product ideas with AI assistance.

---

## Quick Start

```bash
# Clone and enter directory
cd caedoapi

# Create virtual environment
python3 -m venv .venv
source .venv/bin/activate  # On Windows: .venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Run the app
streamlit run app.py
```

---

## Documentation

All technical documentation is in the `docs/` folder:

| Document | Description |
|----------|-------------|
| [PRD.md](docs/PRD.md) | Product Requirements Document |
| [TECH_SPEC.md](docs/TECH_SPEC.md) | Technical Specification & Architecture |
| [DATABASE_SCHEMA.md](docs/DATABASE_SCHEMA.md) | SQLite Schema Design |
| [IMPLEMENTATION_PHASES.md](docs/IMPLEMENTATION_PHASES.md) | Step-by-Step Build Guide |
| [UI_SPECIFICATION.md](docs/UI_SPECIFICATION.md) | Page Layouts & Components |

For AI coding agents, see [AGENTS.md](AGENTS.md) for project rules.

---

## Features

- **🏭 Job Management** — Create, queue, and track print jobs
- **🎯 Intelligent Routing** — Recommends best printer with explanation
- **📊 Reports** — Utilization, failure rates, timing analytics
- **💰 Cost Engine** — Transparent profit/margin calculations
- **🤖 Business Brain** — AI-powered product idea evaluation

---

## Project Structure

```
caedoapi/
├── app.py                    # Entrypoint
├── pages/                    # Streamlit pages
├── caedoapi/              # Core logic
│   ├── db.py                 # Database connection
│   ├── repositories/         # CRUD operations
│   ├── domain/               # Business logic
│   └── ai/                   # OpenAI integration
├── .streamlit/               # Config & secrets
├── docs/                     # Documentation
└── farm.db                   # SQLite database (runtime)
```

---

## Configuration

### API Key (Optional)
For AI features, add your OpenAI API key to `.streamlit/secrets.toml`:
```toml
OPENAI_API_KEY = "your_key_here"
```

The app works without an API key (stub mode for development).

---

## Tech Stack

- **Python 3.11+**
- **Streamlit** — UI framework
- **SQLite** — Local database
- **Pandas** — Data processing
- **Plotly** — Interactive charts
- **Pydantic** — Validation
- **OpenAI** — AI integration

---

## License

Personal project — modify freely for your print farm!
