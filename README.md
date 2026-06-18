# Print-OS

**Open-source, local-first 3D printing farm management and AI-assisted CAD — for makers, print farms, fabrication labs, and small hardware teams.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/release-v0.1.0--public-green.svg)](https://github.com/simongonzalezdc/Print-OS/releases)
[![CI](https://github.com/simongonzalezdc/Print-OS/actions/workflows/ci.yml/badge.svg)](https://github.com/simongonzalezdc/Print-OS/actions)

## What is this?

Print-OS is an open-source operating system for managing multiple 3D printers as a unified operation. It combines printer inventory, intelligent job routing, cost tracking, and business reporting with a browser-based, AI-assisted parametric CAD workspace. Built with a local-first philosophy, your designs, print jobs, and business data stay securely on your own hardware unless you explicitly choose to connect to external services.

**Primary Stack:** Python (FastAPI), TypeScript (Next.js 16, React, Three.js), JSCAD, SQLite.

## Features

- **Print Farm Management:** Track printer inventory, status, and materials in a centralized dashboard.
- **Smart Job Routing:** Automatically route new print jobs to the optimal available printer based on material, size, and queue.
- **Cost & Business Analytics:** Calculate cost-per-part, track material usage, and generate reports for studio operations.
- **AI-Assisted 3D CAD:** A standalone, browser-based workspace (`modules/3d-designer`) for parametric design using Three.js and JSCAD.
- **Local-First Architecture:** No cloud dependency. All data and files are stored locally by default.
- **Agent-Ready Interfaces:** First-class support for CLI, MCP, and skill-based agents (like Codex and Claude Code) for automation and integration.
- **Unified Smoke Test:** A single script to verify the health of the entire system from backend to frontend.
- **Modern Tech Stack:** Built on Next.js 16, React, and a typed FastAPI core for reliability and performance.

## Architecture

Print-OS is a monorepo of three cooperating surfaces:

- **`caedo-api`** — FastAPI backend for business logic, smart job routing, and cost calculation.
- **`caedo-web`** — Next.js 16 + React frontend for the CAD workspace and analytics dashboard.
- **`modules/3d-designer`** — Standalone AI-assisted parametric 3D design workspace (Three.js / JSCAD).

## Installation

### Prerequisites

- Python 3.10+
- Node.js 18+ (LTS recommended)
- npm

### Steps

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/simongonzalezdc/Print-OS.git
    cd Print-OS
    ```

2.  **Configure environment variables:**
    ```bash
    cp env.example .env
    # Edit the .env file with your specific configuration (e.g., API keys if needed).
    ```

3.  **Install backend dependencies:**
    ```bash
    cd caedo-api
    pip install -r requirements.txt
    ```

4.  **Install frontend dependencies:**
    ```bash
    cd ../caedo-web
    npm install
    ```

## Quick Start

Get a basic instance running in under 5 minutes.

1.  **Start the backend API server:**
    ```bash
    # From the repository root
    cd caedo-api
    PYTHONPATH=. python3 api/main.py
    ```
    The API will be available at `http://localhost:8000`.

2.  **Start the frontend development server:**
    Open a **new terminal**, then:
    ```bash
    cd Print-OS/caedo-web
    PORT=3002 npm run dev
    ```
    The web interface will be available at `http://localhost:3002`.

3.  **Verify the installation:**
    Run the unified smoke test from the repository root to confirm both surfaces are healthy.
    ```bash
    bash scripts/smoke-test.sh
    ```

## Usage

### Day-to-Day Workflow

1.  **Register Printers:** Add your 3D printers to the inventory via the web UI or API.
2.  **Queue Print Jobs:** Submit jobs with parameters like material (PLA, PETG, ABS), dimensions, and name.
3.  **Let it Route:** The API intelligently routes jobs to the best available printer and calculates costs.
4.  **Monitor & Report:** Track job progress, review material usage, and view business analytics in the dashboard.
5.  **Design (Optional):** Use the integrated 3D designer to create or modify parametric parts directly within the system.

### Agent Surfaces

Print-OS provides direct interfaces for programmatic access and AI agent integration.

- **CLI Tool:** `tools/print_os_cli.py`
  ```bash
  # View the system manifest
  python3 tools/print_os_cli.py manifest --format json

  # Generate a job payload (dry run)
  python3 tools/print_os_cli.py job-payload --name "Gear" --material PLA --width 30 --depth 30 --height 10

  # Check API health
  python3 tools/print_os_cli.py api-get health --base-url http://127.0.0.1:8000
  ```

- **MCP Server:** A Model Context Protocol server is registered via `.mcp.json`. It exposes tools like `print_os_manifest`, `print_os_job_payload`, and `print_os_create_job` for safe automation.

- **Agent Skill:** The `skills/print-os/SKILL.md` file defines the operational workflow for skill-aware agents like Codex and Claude Code.

### Operator Runbook

For detailed verification steps, release checks, and production procedures, see the [Operator Runbook](docs/OPERATOR_RUNBOOK.md).

## FAQ

**Q: What 3D printers are supported?**
A: Print-OS is printer-agnostic at the management layer. It tracks any FDM/FFF printer via its inventory system. The actual slicing and printing is handled by your existing slicer software; Print-OS manages the queue and routing to the machine's network endpoint or serial interface.

**Q: Is my data sent to the cloud?**
A: No. By default, Print-OS is local-first. All printer data, job queues, design files, and analytics are stored in a local SQLite database on your machine. Cloud integration is possible but must be explicitly configured.

**Q: Can I use this for non-3D printing manufacturing?**
A: While optimized for 3D printing, the core concepts of inventory, job queues, and cost tracking can be adapted for other small-batch fabrication workflows (e.g., laser cutting, CNC routing). The AI CAD features are specific to 3D design.

**Q: How do I contribute to the project?**
A: We welcome contributions! Please read our [Contributing Guide](CONTRIBUTING.md) to get started with reporting issues, suggesting features, or submitting code.

**Q: Is there a hosted or SaaS version?**
A: Print-OS is designed for local deployment to give you full control. There is no official hosted version at this time.

## Contributing

Contributions are what make the open-source community such an amazing place to learn, inspire, and create. Any contributions you make are **greatly appreciated**.

Please read our [Contributing Guidelines](CONTRIBUTING.md) for details on our code of conduct and the process for submitting pull requests.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for the full text.

## Links

- **AI & Agent Navigation:** [llms.txt](llms.txt) - A summary file for AI discovery.
- **Agent Skill Definition:** [skills/print-os/SKILL.md](skills/print-os/SKILL.md)
- **MCP Server Configuration:** [.mcp.json](.mcp.json)
- **Operator Verification:** [docs/OPERATOR_RUNBOOK.md](docs/OPERATOR_RUNBOOK.md)
- **MIT License:** [LICENSE](LICENSE)
- **KyaniteLabs:** [kyanitelabs.tech](https://kyanitelabs.tech)