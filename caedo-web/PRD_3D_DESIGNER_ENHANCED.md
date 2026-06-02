# Caedo 3D — Product Requirements Document

> **Version:** 2.0.0  
> **Target:** Local-first parametric 3D design for Orca Slicer  
> **Last Updated:** November 2024

---

## 🎯 Vision

**Caedo 3D** is a voice-controlled, AI-powered parametric CAD tool that runs entirely locally and exports print-ready files directly to **Orca Slicer**.

*"Tell the AI what you want. It generates printable code. Export to your printer."*

---

## ⚠️ MVP Scope: Local-Only, Fully Featured

| ✅ In MVP | ❌ Not in MVP |
|-----------|--------------|
| Full parametric modeling (JSCAD) | User authentication |
| AI code generation (Claude) | Cloud database |
| Voice control | Real-time collaboration |
| DFM validation | Generative AI mesh (Meshy) |
| Component library | Multi-material support |
| 3MF/STL export | Direct printer control |
| Local storage (IndexedDB) | |

**Single user. Local machine. Maximum capability.**

---

## 1. Core Features

### 1.1 Parametric 3D Modeling Engine

**Goal:** Create manufacturable 3D parts using code-based parametric design.

**Implementation:**
- **JSCAD** (@jscad/modeling) for CSG operations
- **React Three Fiber** for real-time preview
- **Three.js CSG** (@react-three/csg) for viewport rendering

**Capabilities:**
- Primitives: box, sphere, cylinder, torus, polyhedron
- Boolean operations: union, subtract, intersect
- Transformations: translate, rotate, scale, mirror
- 2D extrusion: rectangle, circle, polygon → solids
- Parametric editing with instant preview

### 1.2 AI-Powered Design (Multi-Provider)

**Goal:** Convert natural language to valid, printable JSCAD code.

**Supported AI Providers:**
| Provider | Type | Best For |
|----------|------|----------|
| **Ollama** | Local | Privacy, free, offline |
| **Anthropic Claude** | Cloud | Best quality |
| **OpenAI GPT-4** | Cloud | Fast, reliable |
| **Groq** | Cloud | Very fast inference |
| **OpenRouter** | Cloud | Access to 100+ models |

**System Prompt Includes:**
- DFM rules (wall thickness, overhangs, tolerances)
- Component library (Raspberry Pi, Arduino, NEMA17, etc.)
- Code patterns for enclosures, standoffs, snap-fits
- Validation checklist

**Capabilities:**
- *"Create a 50x30x20mm box with 2mm walls"*
- *"Make a case for Raspberry Pi 4 with ventilation"*
- *"Add M3 mounting holes at each corner"*
- Iterative refinement: *"Make it taller"*, *"Round the edges"*

**Technical:**
- Vercel AI SDK v4 for streaming
- Claude 3.5 Sonnet model
- Structured tool calling for operations
- Context includes current scene state

### 1.3 Voice Control

**Goal:** Hands-free design workflow while prototyping.

**Implementation:**
- **Web Speech API** (browser native, free)
- **Optional Whisper** (better accuracy, requires API key)
- Graceful fallback chain

**Commands:**
| Category | Examples |
|----------|----------|
| Create | "Add a cube", "Create a cylinder 20mm diameter" |
| Modify | "Make it bigger", "Scale by 1.5" |
| Boolean | "Cut a hole", "Combine these parts" |
| Navigate | "Select that", "Undo", "Redo" |
| Export | "Save for printing", "Export as STL" |

### 1.4 Design for Manufacturing (DFM)

**Goal:** Every generated part is print-ready without manual fixes.

**Built-in Knowledge:**
| Rule | Value | Enforcement |
|------|-------|-------------|
| Min wall thickness | 1.2mm | Error if violated |
| Max overhang angle | 45° | Warning + chamfer suggestion |
| Hole oversizing | +0.2mm | Auto-applied |
| Bottom chamfer | 0.5mm × 45° | Auto-applied |
| Part clearance | 0.3mm | Applied to fits |
| Max size | 250×250×250mm | Error if exceeded |

**Validation:**
- Manifold check (watertight mesh)
- Self-intersection detection
- Degenerate triangle removal
- Thin wall identification

### 1.5 Component Library

**Goal:** Instant access to standard dimensions for common parts.

**Included Components:**

| Category | Components |
|----------|------------|
| Raspberry Pi | Pi 5, Pi 4, Pi Zero 2W, Pico |
| Arduino | Uno R3, Nano, Mega 2560 |
| ESP32 | DevKit V1, S3, C3 Mini |
| Motors | NEMA17, NEMA23, 28BYJ-48, SG90, MG996R |
| Displays | 0.96" OLED, LCD 1602 |
| Sensors | HC-SR04, PIR, DHT22 |
| Power | Barrel jack, USB-C, rocker switch |
| Fasteners | M2-M8 screws, heat-set inserts, nuts |

**Data Includes:**
- PCB dimensions and thickness
- Mounting hole positions and screw sizes
- Port locations and sizes
- Standoff heights
- Clearance requirements

### 1.6 Export Pipeline

**Goal:** One-click export to Orca Slicer-ready files.

**Formats:**
| Format | Use Case |
|--------|----------|
| **3MF** | Preferred — full metadata, thumbnails |
| STL Binary | Universal compatibility |
| STL ASCII | Debugging, human-readable |

**Pre-Export Validation:**
1. Check manifold (watertight)
2. Check self-intersections
3. Check wall thickness
4. Check build volume fit
5. Offer auto-repair if issues found

**3MF Features:**
- Model geometry
- Metadata (title, creator, date)
- Thumbnail preview
- Build plate position

---

## 2. Technical Architecture

### 2.1 Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Next.js | 15.x |
| UI | React | 19.x |
| 3D Rendering | React Three Fiber | 9.x |
| 3D Engine | Three.js | 168.x |
| CSG Operations | @jscad/modeling | 2.x |
| State | Zustand | 5.x |
| AI SDK | Vercel AI SDK | 4.x |
| AI Models | Ollama (local), Claude, GPT-4, Groq | - |
| Storage | IndexedDB (idb-keyval) | 6.x |
| Export | JSZip | 3.x |
| Styling | Tailwind CSS | 4.x |

### 2.2 Data Flow

```
┌────────────────┐
│ User Input     │ Voice or Text
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Claude AI      │ Generate JSCAD code
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ JSCAD Executor │ Run code → CSG geometry
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Three.js Mesh  │ Display in viewport
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ Validation     │ DFM checks
└───────┬────────┘
        │
        ▼
┌────────────────┐
│ 3MF Export     │ Ready for Orca Slicer
└────────────────┘
```

### 2.3 File Structure

```
caedo-3d/
├── app/
│   ├── page.tsx                 # Main editor
│   └── api/ai/generate/route.ts # Claude endpoint
├── components/
│   ├── canvas/
│   │   ├── Scene.tsx
│   │   ├── CSGPreview.tsx
│   │   └── Controls.tsx
│   ├── panels/
│   │   ├── AIChat.tsx
│   │   ├── CodeEditor.tsx
│   │   └── ExportPanel.tsx
│   └── voice/
│       └── VoiceInput.tsx
├── lib/
│   ├── jscad/
│   │   ├── executor.ts
│   │   └── to-three.ts
│   ├── export/
│   │   ├── 3mf.ts
│   │   ├── stl.ts
│   │   └── validate.ts
│   ├── ai/
│   │   └── system-prompt.ts
│   ├── constants/
│   │   ├── dfm.ts
│   │   ├── components.ts
│   │   └── materials.ts
│   └── storage/
│       └── local.ts
├── types/
│   └── index.ts
└── docs/
    ├── DFM_KNOWLEDGE_BASE.md
    ├── COMPONENT_LIBRARY.md
    └── EXPORT_PIPELINE.md
```

---

## 3. User Interface

### 3.1 Layout

```
┌─────────────────────────────────────────────────────────────┐
│  Caedo 3D              [Voice] [Export] [Settings]     │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────────────────────────────────────┐ ┌──────────┐ │
│  │                                          │ │ AI Chat  │ │
│  │                                          │ │          │ │
│  │           3D Viewport                    │ │ User: .. │ │
│  │                                          │ │ AI: ...  │ │
│  │        (React Three Fiber)               │ │          │ │
│  │                                          │ │ [Send]   │ │
│  │                                          │ ├──────────┤ │
│  │                                          │ │ Code     │ │
│  │                                          │ │          │ │
│  │                                          │ │ const..  │ │
│  └──────────────────────────────────────────┘ └──────────┘ │
│                                                             │
├─────────────────────────────────────────────────────────────┤
│  [Cube] [Cylinder] [Sphere]  |  Status: Ready to export     │
└─────────────────────────────────────────────────────────────┘
```

### 3.2 Interaction States

| State | Visual Feedback |
|-------|-----------------|
| Listening | Pulsing microphone icon |
| Processing | Loading spinner in chat |
| Generating | Code streaming in editor |
| Validation Error | Red highlight on issue |
| Export Ready | Green checkmark |

---

## 4. Performance Requirements

| Metric | Target |
|--------|--------|
| Initial load | < 3 seconds |
| Voice recognition latency | < 500ms |
| AI code generation | < 5 seconds |
| JSCAD execution | < 1 second |
| Mesh preview update | 60 FPS |
| 3MF export | < 2 seconds |

---

## 5. Development Phases

### Phase 1: Foundation (Week 1-2)
- [ ] Next.js 15 project setup
- [ ] React Three Fiber canvas
- [ ] Basic JSCAD integration
- [ ] Primitive shapes (cube, sphere, cylinder)
- [ ] Zustand store architecture

### Phase 2: AI Integration (Week 3-4)
- [ ] Claude API route
- [ ] System prompt with DFM rules
- [ ] Natural language → JSCAD pipeline
- [ ] Streaming response UI

### Phase 3: Voice + UI (Week 5)
- [ ] Web Speech API integration
- [ ] Voice command mapping
- [ ] Chat panel
- [ ] Code editor panel

### Phase 4: Export (Week 6)
- [ ] 3MF export implementation
- [ ] STL export
- [ ] Mesh validation
- [ ] Auto-repair

### Phase 5: Polish (Week 7-8)
- [ ] Component library integration
- [ ] Local storage persistence
- [ ] Error handling
- [ ] Performance optimization
- [ ] Orca Slicer testing

---

## 6. Success Criteria

| Criteria | Measurement |
|----------|-------------|
| Voice accuracy | >90% command recognition |
| Code validity | >95% valid JSCAD output |
| Print success | >98% manifold meshes |
| Export speed | <2 seconds for typical part |
| Orca Slicer compatibility | 100% valid 3MF files |

---

## 7. Future Roadmap (Post-MVP)

| Phase | Features |
|-------|----------|
| v1.1 | User accounts, cloud sync |
| v1.2 | Real-time collaboration |
| v1.3 | AI mesh generation (Meshy integration) |
| v1.4 | Multi-material support |
| v1.5 | Direct printer integration |

---

## 8. References

### Documentation
- [DFM Knowledge Base](docs/DFM_KNOWLEDGE_BASE.md)
- [Component Library](docs/COMPONENT_LIBRARY.md)
- [Export Pipeline](docs/EXPORT_PIPELINE.md)
- [MVP Scope](docs/MVP_SCOPE.md)

### External
- [JSCAD Documentation](https://openjscad.xyz/)
- [React Three Fiber](https://docs.pmnd.rs/react-three-fiber)
- [3MF Specification](https://3mf.io/spec/)
- [Vercel AI SDK](https://sdk.vercel.ai/)
- [Orca Slicer](https://bambulab.com/en/download/studio)
