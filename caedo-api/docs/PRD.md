# Product Requirements Document (PRD)
## Caedo API — 3D Print Farm Decision Support System

**Version:** 1.0  
**Date:** December 25, 2025  
**Status:** Draft for Development

---

## 1. Executive Summary

Caedo API is a **personal 3D print farm decision support system** built with Streamlit. It helps operators manage print jobs, recommend optimal printer assignments, track costs, and evaluate product ideas using AI-powered analysis combined with real cost math.

### Key Value Propositions
1. **Intelligent Job Routing** — Recommends the best printer for each job with transparent scoring
2. **Lifecycle Management** — Track jobs from queue to completion with full audit trail
3. **Cost Transparency** — Every calculation shows its formula and inputs
4. **Business Intelligence** — AI-powered product idea evaluation with real cost calculations

---

## 2. Target User

**Persona:** Solo or small-team 3D print farm operator  
**Environment:** Managing 2-10 printers (Anycubic Kobra series or similar)  
**Goals:**
- Efficiently route print jobs to appropriate printers
- Track what ran where and why
- Understand true costs and profitability
- Evaluate new product ideas before committing time/materials

---

## 3. What Caedo API IS and IS NOT

### ✅ In Scope (MVP)
| Feature | Description |
|---------|-------------|
| Job Intake | Accept jobs from orders, batches, personal projects |
| Printer Recommendation | Constraints + scoring with explanation |
| Job Lifecycle | Queued → Printing → Completed/Failed/Canceled |
| History Tracking | What ran where, outcomes, actual time/material |
| Idea Evaluation | AI analysis + real cost math |
| Settings Management | Printers, materials, costs, routing rules |
| Reports | Utilization, failure rates, costs, trends |

### ❌ Out of Scope (MVP)
| Excluded | Reason |
|----------|--------|
| Direct G-code sending | Not a printer controller |
| OctoPrint/Moonraker integration | Future enhancement |
| Terms-violating scraping | Compliance |
| Real-time printer monitoring | Out of scope for decision support |

---

## 4. Functional Requirements

### FR-1: Job Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-1.1 | Create job with: name, source, dimensions (mm), material, color count, estimated grams/minutes, priority, due date | Must Have |
| FR-1.2 | System recommends printer with explanation | Must Have |
| FR-1.3 | User can accept recommendation or override | Must Have |
| FR-1.4 | Jobs follow strict state machine transitions | Must Have |
| FR-1.5 | Record actual grams/minutes on completion | Should Have |
| FR-1.6 | Record failure reason on failure | Must Have |

### FR-2: Printer Routing Engine
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-2.1 | Filter printers by hard constraints (volume, material, multicolor) | Must Have |
| FR-2.2 | Score remaining printers on urgency match, reliability, right-sizing | Must Have |
| FR-2.3 | Return scoring breakdown with every recommendation | Must Have |
| FR-2.4 | Store explanation in job record | Must Have |

### FR-3: Printer Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-3.1 | Add/edit/delete printer profiles | Must Have |
| FR-3.2 | Printer attributes: name, build volume, materials, multicolor, speed tier, reliability | Must Have |
| FR-3.3 | Printer data stored in database, not code | Must Have |

### FR-4: Cost Management
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-4.1 | Configure cost constants in Settings UI | Must Have |
| FR-4.2 | Costs include: filament, electricity, labor, depreciation, platform fees, packaging | Must Have |
| FR-4.3 | All cost calculations show formula and inputs | Must Have |

### FR-5: Business Brain (AI Evaluation)
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-5.1 | Accept product idea text input | Must Have |
| FR-5.2 | AI returns structured JSON (category, difficulty, price range, risks, materials, time/gram estimates) | Must Have |
| FR-5.3 | App computes costs/profit/margin using stored constants | Must Have |
| FR-5.4 | Display assumptions and allow "what-if" adjustments | Must Have |
| FR-5.5 | Work without API key (stub mode) | Must Have |
| FR-5.6 | Label all AI outputs as "AI Estimate" | Must Have |

### FR-6: Reports
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-6.1 | Jobs per printer chart | Must Have |
| FR-6.2 | Completion rate chart | Must Have |
| FR-6.3 | Failures by material chart | Should Have |
| FR-6.4 | Average time by printer chart | Should Have |
| FR-6.5 | Date range filtering | Must Have |

### FR-7: Data Persistence
| ID | Requirement | Priority |
|----|-------------|----------|
| FR-7.1 | SQLite database, created on first run | Must Have |
| FR-7.2 | All data persists across app restarts | Must Have |
| FR-7.3 | Export to CSV | Should Have |
| FR-7.4 | Simple backup mechanism | Should Have |

---

## 5. Non-Functional Requirements

| Category | Requirement |
|----------|-------------|
| **Performance** | Dashboard loads in < 3 seconds with 1000 jobs |
| **Reliability** | App handles missing API key gracefully |
| **Usability** | All values show units (mm, g, min, $) |
| **Maintainability** | No hardcoded printer specs or costs |
| **Security** | API keys in secrets file, never in code |
| **Portability** | Runs on any Python 3.11+ environment |

---

## 6. Success Criteria

The project is **complete** when a user can:
1. ✅ Configure printers and costs in Settings
2. ✅ Add jobs and receive a recommended printer **with explanation**
3. ✅ Manage job lifecycle and record actual outcomes
4. ✅ See reports on utilization, failures, and timing
5. ✅ Evaluate product ideas with AI + computed profit/margin
6. ✅ Close and reopen app — all data persists

---

## 7. Constraints & Assumptions

### Technical Constraints
- Python 3.11+ required
- Streamlit for UI (no other frameworks)
- SQLite for persistence (no external database)
- OpenAI API for AI features (with stub fallback)

### Business Constraints
- Single-user application (no auth/multi-tenancy)
- Local-first deployment
- No real-time printer integration

### Assumptions
- User understands 3D printing terminology
- User will provide slicer estimates (grams, minutes) manually
- User accepts AI estimates as guidance, not guarantees
