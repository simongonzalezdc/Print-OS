# Print-OS Operator Runbook

This runbook is the public-safe path for running, verifying, and extending Print-OS after the June 2026 cleanup.

## Repo Boundary

This public repository should contain source code, tests, docs, sanitized examples, and project configuration only.

Do not commit API keys, `.env` files, `.streamlit/secrets.toml`, printer credentials, personal notes, customer data, local databases, `.omx`, `.next`, `node_modules`, or scratch exports.

## Local Setup

Run each app from its own directory.

```bash
cd caedo-api
python3 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

```bash
cd caedo-web
npm install
```

```bash
cd modules/3d-designer
npm install
```

## Operator Paths

### FastAPI Backend

```bash
cd caedo-api
source .venv/bin/activate
PYTHONPATH=. uvicorn api.main:app --host 127.0.0.1 --port 8000
```

Primary checks:

- `http://127.0.0.1:8000/health`
- `http://127.0.0.1:8000/openapi.json`
- printer create/read/status
- job create/read/status
- queue refresh and WebSocket queue update
- business cost calculation
- inventory create/list
- project sync
- system backup download

### Streamlit Console

```bash
cd caedo-api
source .venv/bin/activate
streamlit run app.py --server.address 127.0.0.1 --server.port 8501 --server.headless true
```

Primary pages:

- Home
- Facility
- Business
- Settings
- Reports
- Assistant

### Caedo Web

```bash
cd caedo-web
SKIP_OLLAMA_BOOT=true npm run dev -- --hostname 127.0.0.1 --port 3002
```

Primary routes:

- `/`
- `/facility`
- `/facility/inventory`
- `/facility/jobs`
- `/facility/queue`
- `/business`
- `/settings`
- `/settings/usage`

### 3D Designer

```bash
cd modules/3d-designer
SKIP_OLLAMA_BOOT=true npm run dev -- --hostname 127.0.0.1 --port 3003
```

Primary operator checks:

- page renders without console errors
- canvas is nonblank
- prompt input accepts a design request
- toolbar selection actions do not crash with an empty selection

## Verification Gate

Run this before pushing public work.

```bash
cd caedo-api
source .venv/bin/activate
python -m pytest -q
```

```bash
cd caedo-web
SKIP_OLLAMA_BOOT=true npm run validate
```

```bash
cd modules/3d-designer
SKIP_OLLAMA_BOOT=true npm run validate
```

```bash
gitleaks git . --no-banner --redact
git rev-list --objects --all | rg '(^|/)(\.next|\.omx|source-material)(/|$)' && exit 1 || true
```

If UI changed, also run a browser route sweep and keep screenshots for the changed paths.

## Release Baseline

Use annotated public tags after the verification gate passes.

```bash
git tag -a v0.1.0-public -m "Print-OS public-safe baseline"
git push origin main v0.1.0-public
```

## Troubleshooting

- If `TestClient` warns about Starlette using deprecated `httpx`, reinstall requirements so `httpx2` is present.
- If the Next apps try to start Ollama during CI or smoke tests, set `SKIP_OLLAMA_BOOT=true`.
- If a port is busy, stop the old local process instead of changing published docs to random ports.
