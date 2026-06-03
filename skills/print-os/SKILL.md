---
name: print-os
description: Use when operating, extending, debugging, or explaining Print-OS: a local-first 3D print farm manager with FastAPI, Streamlit, Next.js, Three.js, JSCAD, print queues, printer inventory, cost tracking, backup workflows, and AI-assisted CAD. Also use when an agent needs to create print-job payloads, inspect local API state, or preserve the public-safe repo boundary.
---

# Print-OS

Print-OS is a local-first fabrication operations system. Treat it as three cooperating surfaces:

- `caedo-api`: FastAPI backend, Streamlit operator console, SQLite, printer/job/queue/costing/inventory/business routes.
- `caedo-web`: Next.js dashboard and CAD/analytics surface.
- `modules/3d-designer`: standalone Three.js/JSCAD AI-assisted parametric design workspace.

## Operating Rules

1. Preserve the public-safe boundary. Do not commit `.env`, `.streamlit/secrets.toml`, printer credentials, customer data, local databases, `.omx`, `.next`, `node_modules`, or scratch exports.
2. Prefer local verification before claims:
   - `cd caedo-api && python -m pytest -q`
   - `cd caedo-web && SKIP_OLLAMA_BOOT=true npm run validate`
   - `cd modules/3d-designer && SKIP_OLLAMA_BOOT=true npm run validate`
   - `bash scripts/smoke-test.sh` when services are running
3. Use the API for operational state instead of guessing from docs.
4. Keep write actions explicit. Creating jobs changes local state; reading manifests, queues, printers, and jobs is safe.

## Optional Local Tools

From the repo root:

```bash
python3 tools/print_os_cli.py manifest --format json
python3 tools/print_os_cli.py job-payload --name "Bracket" --material PLA --width 40 --depth 20 --height 12 --format json
python3 tools/print_os_cli.py api-get health --base-url http://127.0.0.1:8000
python3 tools/print_os_cli.py create-job --name "Bracket" --material PLA --width 40 --depth 20 --height 12
```

If the MCP server is configured, use:

- `print_os_manifest`
- `print_os_job_payload`
- `print_os_api_get`
- `print_os_create_job`

## Common Paths

- Backend health: `http://127.0.0.1:8000/health`
- Web app: `http://127.0.0.1:3002`
- 3D designer: `http://127.0.0.1:3003`
- Streamlit console: `http://127.0.0.1:8501`

Read `llms.txt` for agent navigation and `docs/OPERATOR_RUNBOOK.md` for the complete public operator path.
