# VoiceForge 3D

> **Voice-first, AI-powered parametric 3D design for 3D printing**

VoiceForge 3D is a local-first web application that lets you design 3D-printable parts using natural language. Tell the AI what you want, it generates parametric JSCAD code, and you export directly to **Orca Slicer** for slicing and printing.

![Status](https://img.shields.io/badge/status-MVP%20Development-blue)
![License](https://img.shields.io/badge/license-MIT-green)

---

## ✨ Features

### 🎤 Voice-First Design
- Speak naturally: *"Create a box 50mm wide with rounded corners"*
- Hands-free workflow while prototyping at your bench
- Web Speech API with optional Whisper for accuracy

### 🤖 AI-Powered Modeling
- **Phi-4 Mini (via Ollama)** is the default on-device AI
- Automatically falls back to Anthropic/OpenAI/Groq when configured
- Built-in DFM (Design for Manufacturing) knowledge
- Knows standard component dimensions (Raspberry Pi, Arduino, NEMA17, etc.)
- Iterative refinement: *"Make it taller"*, *"Add a hole for M3 screw"*

### 🎯 Print-Ready Output
- **3MF export** — native Orca Slicer format with metadata
- **STL export** — universal compatibility
- Mesh validation before export (manifold check, wall thickness)
- Auto-repair for common issues

### 🔧 Parametric Modeling
- Full CSG operations (union, subtract, intersect)
- Edit dimensions and see instant updates
- Complete undo/redo history
- Code is always visible and editable

---

## 🚀 Quick Start

### Prerequisites
- Node.js 20+ 
- npm (bundled with Node 20)  
- [Ollama](https://ollama.com/download) installed locally (the dev server will auto-start it)

### Installation

```bash
# Clone the repository
git clone https://github.com/yourusername/voiceforge-3d.git
cd voiceforge-3d

# Install dependencies
npm install

# Create environment file
cp env.example.txt .env.local

# Launch (will auto-start Ollama + Phi-4 Mini if needed)
npm run dev
```

The dev script calls `scripts/ensure-ollama.js`, which:
1. Starts `ollama serve` if it’s not running
2. Pulls the recommended model `phi4-mini:latest` if missing  
3. Waits until the API is reachable before launching Next.js

Set `SKIP_OLLAMA_BOOT=true` if you need to skip this bootstrap step (e.g. CI).

Open [http://localhost:3000](http://localhost:3000) in your browser when the console says “Ready”.

### Environment Variables

```bash
# Default: local Phi-4 Mini via Ollama (no API key required)
AI_PROVIDER=ollama
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=phi4-mini:latest

# Optional: switch to a cloud provider
# AI_PROVIDER=anthropic
# ANTHROPIC_API_KEY=your_api_key_here
```

Use Ollama for fully local workflows; switch to Anthropic/OpenAI/Groq only if you need cloud quality or have hardware constraints. See [docs/AI_PROVIDERS.md](docs/AI_PROVIDERS.md) for all options.

---

## 📖 Usage

### Voice Commands

| Say This | Get This |
|----------|----------|
| *"Add a cube"* | 20×20×20mm box |
| *"Create a box 50 by 30 by 20 millimeters"* | Custom sized box |
| *"Make it taller"* | Increase Z dimension |
| *"Add a hole for M3 screw at the center"* | 3.2mm clearance hole |
| *"Make a case for Raspberry Pi 4"* | Full enclosure with mounting posts |
| *"Export for printing"* | Validate + save 3MF |

### Design Workflow

1. **Describe** what you want (voice or text)
2. **Review** the generated geometry in the 3D viewport
3. **Refine** with follow-up commands
4. **Export** to 3MF when ready
5. **Open in Orca Slicer** for slicing and printing

---

## 🏗️ Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    VoiceForge 3D                            │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │  Voice   │───▶│  Claude  │───▶│  JSCAD   │              │
│  │  Input   │    │    AI    │    │ Executor │              │
│  └──────────┘    └──────────┘    └────┬─────┘              │
│                                       │                     │
│                                       ▼                     │
│  ┌──────────────────────────────────────────────────────┐  │
│  │              React Three Fiber Canvas                 │  │
│  │                                                       │  │
│  │   ┌─────────────┐  ┌─────────────┐  ┌────────────┐  │  │
│  │   │ CSG Preview │  │  Grid/Axes  │  │  Controls  │  │  │
│  │   └─────────────┘  └─────────────┘  └────────────┘  │  │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  ┌──────────┐    ┌──────────┐    ┌──────────┐              │
│  │ Validate │───▶│  Export  │───▶│  Orca    │              │
│  │   Mesh   │    │   3MF    │    │  Studio  │              │
│  └──────────┘    └──────────┘    └──────────┘              │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19 |
| 3D Rendering | React Three Fiber 9, Three.js 168 |
| Parametric CAD | JSCAD (@jscad/modeling) |
| AI | Ollama (local) or Claude/GPT-4/Groq (cloud) |
| Voice | Web Speech API, optional Whisper |
| State | Zustand 5 |
| Storage | IndexedDB (local) |
| Export | 3MF (native), STL |

---

## 📐 Design for Manufacturing (DFM)

VoiceForge 3D automatically applies printing best practices:

### Built-in Rules

| Rule | Value | Why |
|------|-------|-----|
| Min wall thickness | 1.2mm | 3 perimeters for strength |
| Max overhang angle | 45° | Prints without supports |
| Hole oversizing | +0.2mm | Compensates for shrinkage |
| Bottom chamfer | 0.5mm | Prevents elephant's foot |
| Part clearance | 0.3mm | Allows smooth assembly |

### Component Library

Pre-loaded dimensions for common parts:
- **Raspberry Pi** (5, 4, Zero 2W, Pico)
- **Arduino** (Uno, Nano, Mega)
- **ESP32** (DevKit, S3, C3)
- **Motors** (NEMA17, NEMA23, servos)
- **Fasteners** (M2-M8 screws, heat-set inserts)
- **Sensors** (HC-SR04, PIR, DHT22)

---

## 📁 Project Structure

```
voiceforge-3d/
├── app/
│   ├── page.tsx              # Main editor
│   └── api/ai/generate/      # Claude API route
├── components/
│   ├── canvas/               # 3D viewport
│   ├── panels/               # UI panels
│   └── voice/                # Voice input
├── lib/
│   ├── jscad/                # JSCAD executor
│   ├── export/               # 3MF/STL export
│   ├── ai/                   # System prompts
│   ├── constants/            # DFM rules, components
│   └── storage/              # IndexedDB
├── docs/
│   ├── DFM_KNOWLEDGE_BASE.md
│   ├── COMPONENT_LIBRARY.md
│   ├── EXPORT_PIPELINE.md
│   └── MVP_SCOPE.md
└── types/                    # TypeScript definitions
```

---

## 🔌 Orca Slicer Integration

VoiceForge 3D exports **3MF files** which are Orca Slicer's native format.

### Export Workflow

1. Click **Export** or say *"Export for printing"*
2. Mesh is validated (manifold, wall thickness, size)
3. Issues are shown with auto-repair option
4. 3MF file is generated with metadata and thumbnail
5. Open the file in Orca Slicer
6. Slice and send to your printer

### Supported Formats

| Format | Orca Slicer | Metadata | Recommended |
|--------|--------------|----------|-------------|
| **3MF** | ✅ Native | ✅ Full | ✅ Yes |
| STL Binary | ✅ | ❌ | For compatibility |
| STL ASCII | ✅ | ❌ | For debugging |

---

## 🤝 Contributing

Contributions are welcome! Please read the [contribution guidelines](CONTRIBUTING.md) first.

### Development

```bash
# Run development server
pnpm dev

# Run type checking
pnpm typecheck

# Run linting
pnpm lint

# Run tests
pnpm test
```

---

## 📜 License

MIT License - see [LICENSE](LICENSE) for details.

---

## 🙏 Acknowledgments

- [JSCAD](https://github.com/jscad/OpenJSCAD.org) — Parametric CAD in JavaScript
- [React Three Fiber](https://github.com/pmndrs/react-three-fiber) — React renderer for Three.js
- [Anthropic Claude](https://anthropic.com) — AI code generation
- [Orca Slicer](https://github.com/SoftFever/OrcaSlicer) — Open source slicer for 3D printing
