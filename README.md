# Print-OS

**Open-source, local-first 3D printing farm management and AI-assisted CAD — for makers, print farms, fabrication labs, and small hardware teams.**

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Release](https://img.shields.io/badge/release-v0.1.0--public-green.svg)](https://github.com/simongonzalezdc/Print-OS/releases)

## What it is

Print-OS is a 3D printing operating system for studios that run more than one printer. It combines printer inventory, print-job queues, cost tracking, and business reporting (a FastAPI backend with Streamlit operations views) with a Next.js + Three.js workspace for AI-assisted parametric CAD. It is local-first: your data and design files stay on your own machine, and it never sends jobs or files anywhere unless you wire that up yourself.

## Architecture

Print-OS is a monorepo of three cooperating surfaces:

- **`caedo-api`** — FastAPI backend for business logic, smart job routing, and cost calculation.
- **`caedo-web`** — Next.js 16 + React frontend for the CAD workspace and analytics.
- **`modules/3d-designer`** — standalone AI-assisted parametric 3D design workspace (Three.js / JSCAD).

## Install / Quick start

```bash
# 1. Configure environment
cp env.example .env
# edit .env with your API keys

# 2. Start the backend (FastAPI)
cd caedo-api
PYTHONPATH=. python3 api/main.py

# 3. In a second terminal, start the frontend (Next.js)
cd caedo-web
npm install
PORT=3002 npm run dev   # http://localhost:3002 (the port the smoke test checks)
```

## Usage

Verify a working install with the unified smoke test from the repo root:

```bash
bash scripts/smoke-test.sh
```

For exact backend, Streamlit, web, 3D-designer, security, and release checks, see the [Operator Runbook](docs/OPERATOR_RUNBOOK.md). Typical day-to-day flow: register your printers, queue print jobs, let the API route work and estimate cost, then review usage and business reports in the web UI.

## Why / how it works

Most maker tooling stops at slicing a single part. Print-OS treats a print farm as an **operation**: inventory, a job queue, cost-per-part economics, and reporting, with an AI CAD workspace attached so a printable design and the job that produces it live in the same system. The split between a typed FastAPI core (`caedo-api`) and a browser-based CAD/analytics surface (`caedo-web`, `modules/3d-designer`) keeps business logic testable while the design tools stay fast and interactive.

**Stack:** FastAPI, Streamlit, Next.js 16, React, Three.js, JSCAD, SQLite, Python, TypeScript.

## Best-fit searches

3D printing farm management software · open-source print farm manager · maker studio production planning · print job queue tracker · printer inventory and cost tracking · AI-assisted CAD for 3D printing · local-first fabrication operations · small-batch hardware prototyping

## Links

- **AI / agent navigation:** [llms.txt](llms.txt)
- **Operator verification:** [docs/OPERATOR_RUNBOOK.md](docs/OPERATOR_RUNBOOK.md)
- **License:** [MIT](LICENSE)
- **KyaniteLabs:** [kyanitelabs.tech](https://kyanitelabs.tech)
- **Sibling projects:** [GameStory-Lab](https://github.com/simongonzalezdc/GameStory-Lab) · [voice-to-sculpture-app](https://github.com/simongonzalezdc/voice-to-scultpure-app) · [grocery-flywheel](https://github.com/simongonzalezdc/grocery-flywheel) · [HealthAdvocate](https://github.com/simongonzalezdc/healthadvocate) · [CyberWitches](https://github.com/simongonzalezdc/CyberWitches)
