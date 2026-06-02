# VoiceForge 3D - MVP Scope Definition

> **Version:** 1.0.0  
> **Target:** Local-first parametric 3D design for Orca Slicer

---

## 🎯 MVP Vision

**VoiceForge 3D** is a **voice-controlled, AI-powered parametric CAD tool** that runs entirely locally and exports print-ready files directly to **Orca Slicer**.

**One sentence:** *"Tell the AI what you want, it generates printable JSCAD code, you export to Orca Slicer."*

---

## ✅ MVP Features (In Scope)

### 1. Parametric 3D Modeling Engine
- **JSCAD-based CSG operations** (union, subtract, intersect)
- **Primitive shapes:** Box, sphere, cylinder, torus, polyhedron
- **2D extrusion:** Rectangle, circle, polygon → extruded solids
- **Transformations:** Translate, rotate, scale, mirror
- **Boolean operations:** Combine, cut, intersect shapes
- **Parametric editing:** Change dimensions, see instant updates

### 2. AI-Powered Design (Claude)
- **Natural language → JSCAD code** generation
- **DFM-aware output:** AI knows wall thickness, overhangs, tolerances
- **Component-aware:** Knows Raspberry Pi, Arduino, NEMA17 dimensions
- **Iterative refinement:** "Make it taller", "Add a hole here"
- **Code explanation:** AI explains design decisions

### 3. Voice Control
- **Web Speech API** for browser-native recognition
- **Optional Whisper** for better accuracy
- **Natural commands:** "Add a cube", "Make it bigger", "Export"
- **Hands-free workflow:** Design while prototyping

### 4. Design for Manufacturing (DFM)
- **Built-in knowledge base** of printing constraints
- **Real-time validation:** Wall thickness, overhangs, bridges
- **Visual warnings:** Problem areas highlighted in viewport
- **Auto-suggest fixes:** "This wall is too thin, increase to 1.2mm?"

### 5. Component Library
- **Standard electronics:** Raspberry Pi, Arduino, ESP32
- **Motors:** NEMA17, servos, DC motors
- **Fasteners:** M2-M8 screws, heat-set inserts, nuts
- **Connectors:** USB, barrel jack, headers
- **Custom components:** User can add their own

### 6. Export Pipeline
- **3MF export** (preferred for Orca Slicer)
  - Full metadata support
  - Thumbnail preview
  - Print hints
- **STL export** (binary and ASCII)
- **Mesh validation** before export
  - Manifold check
  - Self-intersection detection
  - Minimum wall thickness
- **Auto-repair** for common issues

### 7. Local Storage
- **IndexedDB persistence** for projects
- **Auto-save** every 30 seconds
- **Project history** with undo/redo
- **Export/import** projects as JSON

### 8. 3D Viewport
- **React Three Fiber** rendering
- **Build plate visualization** (250×250mm)
- **Grid and axes** helpers
- **Orbit controls** for navigation
- **Object selection** and manipulation
- **CSG preview** of generated geometry

---

## ❌ NOT in MVP (Post-MVP)

| Feature | Reason | Post-MVP Phase |
|---------|--------|----------------|
| User authentication | Single user, local only | Phase 2 |
| Cloud database | Local storage sufficient | Phase 2 |
| Real-time collaboration | Single user | Phase 3 |
| Generative AI mesh (Meshy) | Focus on parametric | Phase 2 |
| Direct printer control | Use Orca Slicer | Phase 3 |
| Multi-material design | Complexity | Phase 2 |
| Supports generation | Orca Slicer handles | N/A |
| Slicing | Orca Slicer handles | N/A |

---

## 🏗️ Technical Architecture

### Frontend (Browser)
```
┌──────────────────────────────────────────────────────────────┐
│                      Next.js 15 App                          │
├──────────────────────────────────────────────────────────────┤
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │  Voice UI   │  │   AI Chat   │  │   Export    │          │
│  │  Component  │  │   Panel     │  │   Panel     │          │
│  └──────┬──────┘  └──────┬──────┘  └──────┬──────┘          │
│         │                │                │                  │
│         ▼                ▼                ▼                  │
│  ┌────────────────────────────────────────────────────────┐ │
│  │                   Zustand Store                         │ │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐             │ │
│  │  │  Scene   │  │  JSCAD   │  │  History │             │ │
│  │  │  State   │  │  Code    │  │  Stack   │             │ │
│  │  └──────────┘  └──────────┘  └──────────┘             │ │
│  └────────────────────────────────────────────────────────┘ │
│         │                                                    │
│         ▼                                                    │
│  ┌────────────────────────────────────────────────────────┐ │
│  │              React Three Fiber Canvas                   │ │
│  │  ┌──────────────────────────────────────────────────┐ │ │
│  │  │  CSG Preview  │  Grid Floor  │  Camera Controls  │ │ │
│  │  └──────────────────────────────────────────────────┘ │ │
│  └────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────┘
```

### Backend (API Routes)
```
┌────────────────────────────────────────┐
│        Next.js API Routes              │
├────────────────────────────────────────┤
│  POST /api/ai/generate                 │
│    ├── Input: Natural language prompt  │
│    ├── Context: Scene state, DFM rules │
│    └── Output: JSCAD code              │
│                                        │
│  Uses: Anthropic Claude 3.5 Sonnet     │
│  Streaming: Yes (for UX)               │
└────────────────────────────────────────┘
```

### Data Flow
```
User Voice Command
       │
       ▼
┌─────────────────┐
│ Speech → Text   │ (Web Speech API / Whisper)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Claude AI       │ (Generate JSCAD code)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ JSCAD Executor  │ (Run code → geometry)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Three.js Mesh   │ (Display in viewport)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Export to 3MF   │ (For Orca Slicer)
└─────────────────┘
```

---

## 📊 Success Metrics

| Metric | Target |
|--------|--------|
| Voice command recognition | >90% accuracy |
| JSCAD generation success | >95% valid code |
| Mesh validation pass rate | >98% on first export |
| Export to 3MF time | <2 seconds |
| Orca Slicer compatibility | 100% |

---

## 🚀 Development Phases

### Phase 1: Core Engine (Week 1-2)
- [ ] Next.js 15 setup with TypeScript
- [ ] React Three Fiber canvas
- [ ] JSCAD integration and executor
- [ ] Basic primitives (cube, sphere, cylinder)
- [ ] Zustand store architecture

### Phase 2: AI Integration (Week 3-4)
- [ ] Claude API route
- [ ] System prompt with DFM rules
- [ ] Natural language → JSCAD generation
- [ ] Iterative refinement ("make it bigger")

### Phase 3: Voice + UI (Week 5)
- [ ] Web Speech API integration
- [ ] Voice command mapping
- [ ] AI chat panel
- [ ] Properties panel

### Phase 4: Export + Validation (Week 6)
- [ ] 3MF export implementation
- [ ] STL export (binary + ASCII)
- [ ] Mesh validation
- [ ] Auto-repair functions

### Phase 5: Polish (Week 7-8)
- [ ] Component library integration
- [ ] Local storage persistence
- [ ] Error handling + edge cases
- [ ] Performance optimization
- [ ] Testing with Orca Slicer

---

## 🔌 External Dependencies

| Service | Purpose | Required |
|---------|---------|----------|
| Anthropic Claude | AI code generation | ✅ Yes |
| OpenAI Whisper | Voice recognition (optional) | ❌ No |

**Note:** No database, no auth service, no cloud storage required for MVP.

---

## 📁 Deliverables

1. **Working web application** running on localhost
2. **Export pipeline** producing valid 3MF/STL files
3. **Documentation:**
   - DFM Knowledge Base
   - Component Library
   - Export Pipeline Guide
4. **Test files** validated in Orca Slicer
