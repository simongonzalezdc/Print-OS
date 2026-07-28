# Print-OS

Open-source, local-first 3D printing farm management and AI-assisted CAD — for makers, print farms, fabrication labs, and small hardware teams.

## Quick start

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

## Docs

- [Operator Runbook](docs/OPERATOR_RUNBOOK.md)
- [skills/print-os/SKILL.md](skills/print-os/SKILL.md)
- [docs/OPERATOR_RUNBOOK.md](docs/OPERATOR_RUNBOOK.md)
- [kyanitelabs.tech](https://kyanitelabs.tech)
- [GameStory-Lab](https://github.com/simongonzalezdc/GameStory-Lab)

## License

See [LICENSE](LICENSE).
