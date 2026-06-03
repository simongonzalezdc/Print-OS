# CAEDO Ecosystem
**Integrated 3D Design & Manufacturing Platform**

CAEDO (Latin for "I cut/sculpt") is a high-tech ecosystem for voice-first parametric 3D design and integrated production management.

## Architecture
- **caedo-web**: Next.js 16 frontend for voice-powered CAD and analytics.
- **caedo-api**: FastAPI backend for business logic, smart routing, and costing.

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

---
*Powered by GLM-4.7*
