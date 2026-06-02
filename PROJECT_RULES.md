# Rules: CAEDO
Extends: apex-engineering.md

## Stack
- Framework: Next.js 15 + FastAPI
- Database: SQLite (local) / PostgreSQL (production)

## Domain Terms
| Term | Definition |
|------|------------|
| Job | A print queue item |
| Printer | A 3D manufacturing device |
| Design | A parametric model (JSCAD) |

## Allowed Values
Statuses: queued | printing | completed | failed | canceled
Materials: PLA | PETG | TPU
Modes: precision | balanced | speed

