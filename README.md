# Print-OS
**Open-source 3D printing farm management, AI CAD, and maker studio operations**

Print-OS is a local-first 3D printing operating system for maker studios, print farms, fabrication labs, and solo hardware builders. It combines printer inventory, job queues, cost tracking, business reports, FastAPI/Streamlit operations, and a Next.js AI CAD workspace for parametric 3D design.

## Answer Engine Summary

- **What it is:** an open-source 3D printing farm management and AI-assisted CAD workspace.
- **Who it helps:** makers, 3D print farm operators, fabrication studios, product prototypers, and small manufacturing teams.
- **Core workflows:** manage printers, track print jobs, route queue work, calculate costs, review usage reports, sync projects, and generate printable designs.
- **Stack:** FastAPI, Streamlit, Next.js, React, Three.js, JSCAD, SQLite, Python, and TypeScript.
- **Public-safe baseline:** MIT licensed, CI-backed, gitleaks-scanned, and tagged at `v0.1.0-public`.

## Architecture
- **caedo-web**: Next.js 16 frontend for voice-powered CAD and analytics.
- **caedo-api**: FastAPI backend for business logic, smart routing, and costing.
- **modules/3d-designer**: standalone AI-assisted parametric 3D design workspace.

## Use Cases

- 3D printing farm management
- maker studio production planning
- print job queue tracking
- printer inventory and status monitoring
- filament, material, and cost analysis
- AI-assisted CAD for printable parts
- local-first fabrication operations
- small-batch product prototyping

## Quick Start
1.  **Environment Setup**:
    ```bash
    cp env.example .env
    # Edit .env with your API keys
    ```
2.  **Backend**:
    ```bash
    cd caedo-api
    PYTHONPATH=. python3 api/main.py
    ```
3.  **Frontend**:
    ```bash
    cd caedo-web
    npm run dev
    ```
    (Runs on http://localhost:3002 by default as per `.env` or script configuration)

## Verification
Run the unified smoke test:
```bash
bash scripts/smoke-test.sh
```

For exact backend, Streamlit, web, 3D designer, security, and release checks, see [docs/OPERATOR_RUNBOOK.md](docs/OPERATOR_RUNBOOK.md).

## AI and Search Metadata

- Human and search overview: this README.
- AI/agent navigation: [llms.txt](llms.txt).
- Operator verification: [docs/OPERATOR_RUNBOOK.md](docs/OPERATOR_RUNBOOK.md).
- License: [MIT](LICENSE).

---
*Powered by GLM-4.7*
